import { Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DisputeStatus,
  EmbeddingSourceType,
  ReportStatus,
} from '../../../generated/prisma';
import { VectorStoreService } from './vector-store.service';
import { LlmService } from './llm.service';
import { describeReportTarget } from './report-target.util';
import {
  renderSources,
  snippet,
  UNTRUSTED_DATA_RULE,
  type PromptSource,
} from './prompts';

const PRECEDENT_LIMIT = 5;
// Over-fetch, since unresolved cases are filtered out after retrieval.
const PRECEDENT_CANDIDATES = 25;

const ReportAssessmentSchema = z.object({
  suggestedStatus: z.enum(['ACTIONED', 'DISMISSED']),
  confidence: z.enum(['low', 'medium', 'high']),
  flags: z.array(z.string()),
  reasoning: z.string(),
  precedentIds: z.array(z.number()),
});

const DisputeAssessmentSchema = z.object({
  suggestedStatus: z.enum(['RESOLVED', 'REJECTED', 'UNDER_REVIEW']),
  confidence: z.enum(['low', 'medium', 'high']),
  suggestedResolution: z.string(),
  reasoning: z.string(),
  precedentIds: z.array(z.number()),
});

const ADVISORY_RULES = [
  'You are advising a Synergi admin; the admin makes the final decision. Never present your suggestion as decided.',
  'Ground your reasoning in the case content and in how similar past cases (the numbered precedents) were decided. Cite precedents as [1], [2]. If precedents conflict or are absent, say so and lower your confidence.',
  'Use low confidence whenever the evidence is thin or ambiguous.',
  UNTRUSTED_DATA_RULE,
];

@Injectable()
export class ModerationAssistantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vectors: VectorStoreService,
    private readonly llm: LlmService,
  ) {}

  async assessReport(reportId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: {
          select: {
            createdAt: true,
            _count: { select: { reportsFiled: true } },
          },
        },
      },
    });
    if (!report) throw new NotFoundException('Report not found');

    const target = await describeReportTarget(
      this.prisma,
      report.targetType,
      report.targetId,
    );
    const priorReportsOnTarget = await this.prisma.report.groupBy({
      by: ['status'],
      where: {
        targetType: report.targetType,
        targetId: report.targetId,
        id: { not: report.id },
      },
      _count: true,
    });

    const hits = await this.vectors.search(
      `Reason: ${report.reason}\n${target ?? ''}`,
      {
        sourceTypes: [EmbeddingSourceType.REPORT],
        excludeSourceIds: [report.id],
        limit: PRECEDENT_CANDIDATES,
      },
    );
    const resolved = await this.prisma.report.findMany({
      where: {
        id: { in: hits.map((hit) => hit.sourceId) },
        status: { not: ReportStatus.PENDING },
      },
    });
    const precedents = hits
      .map((hit) => ({
        hit,
        report: resolved.find((r) => r.id === hit.sourceId),
      }))
      .filter((entry) => entry.report)
      .slice(0, PRECEDENT_LIMIT);

    const sources: PromptSource[] = precedents.map(
      ({ hit, report: past }, index) => ({
        n: index + 1,
        label: `Past report — decided ${past!.status}`,
        text: hit.content,
      }),
    );

    const caseFacts = [
      `Target type: ${report.targetType}`,
      `Reporter account age: ${Math.floor((Date.now() - report.reporter.createdAt.getTime()) / 86_400_000)} days; reports filed by this reporter in total: ${report.reporter._count.reportsFiled}`,
      `Other reports on the same target: ${priorReportsOnTarget.length === 0 ? 'none' : priorReportsOnTarget.map((group) => `${group._count} ${group.status.toLowerCase()}`).join(', ')}`,
    ].join('\n');

    const assessment = await this.llm.generateStructured(
      ReportAssessmentSchema,
      {
        effort: 'medium',
        system: [
          'You triage user reports on Synergi, a construction marketplace. Suggest ACTIONED (the reported content or account violates norms: harassment, scams, spam, fake reviews, off-platform payment solicitation, illegal or explicit content) or DISMISSED (no violation, a disagreement, or not enough evidence).',
          'flags: short labels for any concrete problems you see in the reported content (e.g. "spam link", "requests off-platform payment", "abusive language"). Empty if none.',
          'reasoning: 2–4 sentences.',
          'precedentIds: the numbers of the precedents you relied on.',
          ...ADVISORY_RULES,
        ].join('\n'),
        prompt: [
          `<case_facts>\n${caseFacts}\n</case_facts>`,
          renderSources([
            {
              n: 0,
              label: 'Report reason (from reporter)',
              text: report.reason,
            },
            {
              n: 0,
              label: 'Reported content',
              text: target ?? '(the reported item no longer exists)',
            },
          ]).replace(/id="0"/g, 'id="case"'),
          sources.length > 0
            ? `<precedents>\n${renderSources(sources)}\n</precedents>`
            : '(No similar past reports have been decided yet.)',
        ].join('\n\n'),
      },
    );

    return {
      suggestedStatus: assessment.suggestedStatus,
      confidence: assessment.confidence,
      flags: assessment.flags,
      reasoning: assessment.reasoning,
      targetSummary: target ? snippet(target, 400) : null,
      precedents: this.pickPrecedents(
        assessment.precedentIds,
        precedents.map(({ hit, report: past }) => ({
          id: past!.id,
          status: past!.status,
          snippet: snippet(hit.content),
        })),
      ),
    };
  }

  async assessDispute(disputeId: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        raisedBy: { select: { role: true, createdAt: true } },
        against: { select: { role: true, createdAt: true } },
      },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');

    const hits = await this.vectors.search(
      `${dispute.reason}\n${dispute.description ?? ''}`,
      {
        sourceTypes: [EmbeddingSourceType.DISPUTE],
        excludeSourceIds: [dispute.id],
        limit: PRECEDENT_CANDIDATES,
      },
    );
    const resolved = await this.prisma.dispute.findMany({
      where: {
        id: { in: hits.map((hit) => hit.sourceId) },
        status: { in: [DisputeStatus.RESOLVED, DisputeStatus.REJECTED] },
      },
    });
    const precedents = hits
      .map((hit) => resolved.find((d) => d.id === hit.sourceId))
      .filter((past): past is (typeof resolved)[number] => Boolean(past))
      .slice(0, PRECEDENT_LIMIT);

    const sources: PromptSource[] = precedents.map((past, index) => ({
      n: index + 1,
      label: `Past dispute — decided ${past.status}`,
      text: [
        `Reason: ${past.reason}`,
        past.description && `Description: ${past.description}`,
        past.resolution && `Admin resolution: ${past.resolution}`,
      ]
        .filter(Boolean)
        .join('\n'),
    }));

    // Activity between the two parties, from platform records (trusted).
    const [raisedByClient, againstClient] = await Promise.all([
      this.prisma.clientProfile.findUnique({
        where: { userId: dispute.raisedById },
        select: { id: true },
      }),
      this.prisma.clientProfile.findUnique({
        where: { userId: dispute.againstId },
        select: { id: true },
      }),
    ]);
    const [raisedByPro, againstPro] = await Promise.all([
      this.prisma.professionalProfile.findUnique({
        where: { userId: dispute.raisedById },
        select: { id: true },
      }),
      this.prisma.professionalProfile.findUnique({
        where: { userId: dispute.againstId },
        select: { id: true },
      }),
    ]);
    const clientId = raisedByClient?.id ?? againstClient?.id;
    const professionalId = raisedByPro?.id ?? againstPro?.id;
    const quotations =
      clientId && professionalId
        ? await this.prisma.quotation.findMany({
            where: { clientId, professionalId },
            select: {
              status: true,
              totalAmount: true,
              currency: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          })
        : [];

    const caseFacts = [
      `Raised by a ${dispute.raisedBy.role.toLowerCase()} against a ${dispute.against.role.toLowerCase()}`,
      `Current status: ${dispute.status}`,
      quotations.length > 0
        ? `Quotations between the parties: ${quotations.map((q) => `${q.currency} ${Number(q.totalAmount)} (${q.status.toLowerCase()}, ${q.createdAt.toISOString().slice(0, 10)})`).join('; ')}`
        : 'No quotations between the parties on record.',
    ].join('\n');

    const assessment = await this.llm.generateStructured(
      DisputeAssessmentSchema,
      {
        effort: 'medium',
        system: [
          'You help Synergi admins handle disputes between clients and construction professionals. Suggest RESOLVED (the complaint has merit and you can propose a fair outcome), REJECTED (the complaint lacks merit or is outside what Synergi can act on), or UNDER_REVIEW (more information is needed first — say what).',
          'suggestedResolution: draft resolution notes the admin could record, 1–3 sentences, neutral in tone. If suggesting UNDER_REVIEW, list what to ask each party.',
          'reasoning: 2–4 sentences.',
          'precedentIds: the numbers of the precedents you relied on.',
          ...ADVISORY_RULES,
        ].join('\n'),
        prompt: [
          `<case_facts>\n${caseFacts}\n</case_facts>`,
          renderSources([
            {
              n: 0,
              label: 'Dispute (written by the party who raised it)',
              text: `Reason: ${dispute.reason}\n${dispute.description ?? ''}`,
            },
          ]).replace(/id="0"/g, 'id="case"'),
          sources.length > 0
            ? `<precedents>\n${renderSources(sources)}\n</precedents>`
            : '(No similar past disputes have been decided yet.)',
        ].join('\n\n'),
      },
    );

    return {
      suggestedStatus: assessment.suggestedStatus,
      confidence: assessment.confidence,
      suggestedResolution: assessment.suggestedResolution,
      reasoning: assessment.reasoning,
      precedents: this.pickPrecedents(
        assessment.precedentIds,
        precedents.map((past) => ({
          id: past.id,
          status: past.status,
          snippet: snippet(
            `${past.reason}${past.resolution ? ` → ${past.resolution}` : ''}`,
          ),
        })),
      ),
    };
  }

  private pickPrecedents<T>(ids: number[], all: T[]) {
    return [...new Set(ids)]
      .filter((n) => all[n - 1])
      .map((n) => ({ n, ...all[n - 1] }));
  }
}
