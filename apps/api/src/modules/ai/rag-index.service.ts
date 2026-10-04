import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingSourceType, MessageType } from '../../../generated/prisma';
import { VectorStoreService } from './vector-store.service';
import { HELP_DOCS } from './help-docs';
import { describeReportTarget } from './report-target.util';

function money(value: unknown): string | null {
  return value == null ? null : `$${Number(value).toLocaleString('en-US')}`;
}

function lines(...parts: (string | null | undefined | false)[]): string {
  return parts.filter(Boolean).join('\n');
}

/**
 * Keeps the `embeddings` table in sync with the source data.
 *
 * Every `index*` method is safe to fire-and-forget (`void ragIndex.indexX()`)
 * from a write path: it never throws, it logs. A failed index only degrades
 * AI answers — it must never fail the user's actual write.
 */
@Injectable()
export class RagIndexService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RagIndexService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vectors: VectorStoreService,
    private readonly config: ConfigService,
  ) {}

  onApplicationBootstrap(): void {
    if (this.config.get<string>('NODE_ENV') === 'test') return;
    void this.safely('help docs', () => this.indexHelpDocs());
  }

  private async safely(label: string, work: () => Promise<void>) {
    try {
      await work();
    } catch (error) {
      this.logger.warn(`Failed to index ${label}: ${(error as Error).message}`);
    }
  }

  // ── Professional content (scope = professional profile id) ──────────

  indexProfessionalProfile(id: string): Promise<void> {
    return this.safely(`professional ${id}`, async () => {
      const profile = await this.prisma.professionalProfile.findUnique({
        where: { id },
        include: {
          user: { select: { firstName: true, lastName: true } },
          category: { select: { name: true } },
          city: { select: { name: true } },
          skills: { include: { skill: { select: { name: true } } } },
        },
      });
      if (!profile) {
        await this.vectors.remove(EmbeddingSourceType.PROFESSIONAL_PROFILE, id);
        return;
      }

      await this.vectors.upsert({
        sourceType: EmbeddingSourceType.PROFESSIONAL_PROFILE,
        sourceId: profile.id,
        scopeId: profile.id,
        text: lines(
          `Professional: ${profile.businessName ?? `${profile.user.firstName} ${profile.user.lastName}`}`,
          profile.tagline,
          profile.category && `Category: ${profile.category.name}`,
          profile.city && `Based in: ${profile.city.name}`,
          profile.skills.length > 0 &&
            `Skills: ${profile.skills.map((entry) => entry.skill.name).join(', ')}`,
          profile.yearsExperience != null &&
            `Years of experience: ${profile.yearsExperience}`,
          profile.languages.length > 0 &&
            `Languages: ${profile.languages.join(', ')}`,
          (profile.hourlyRateMin != null || profile.hourlyRateMax != null) &&
            `Hourly rate: ${[money(profile.hourlyRateMin), money(profile.hourlyRateMax)].filter(Boolean).join(' – ')}`,
          profile.about,
        ),
      });
    });
  }

  indexService(id: string): Promise<void> {
    return this.safely(`service ${id}`, async () => {
      const service = await this.prisma.service.findUnique({
        where: { id },
        include: { category: { select: { name: true } } },
      });
      if (!service || !service.active) {
        await this.vectors.remove(EmbeddingSourceType.SERVICE, id);
        return;
      }

      const price =
        service.priceType === 'FIXED' && service.price != null
          ? `Fixed price ${money(service.price)}`
          : service.priceType === 'HOURLY'
            ? `Hourly ${[money(service.minPrice), money(service.maxPrice)].filter(Boolean).join(' – ')}`
            : 'Price on quotation';

      await this.vectors.upsert({
        sourceType: EmbeddingSourceType.SERVICE,
        sourceId: service.id,
        scopeId: service.professionalId,
        text: lines(
          `Service: ${service.title}`,
          service.category && `Category: ${service.category.name}`,
          price,
          service.description,
        ),
      });
    });
  }

  indexPortfolioProject(id: string): Promise<void> {
    return this.safely(`portfolio project ${id}`, async () => {
      const project = await this.prisma.portfolioProject.findUnique({
        where: { id },
        include: { category: { select: { name: true } } },
      });
      if (!project || !project.published) {
        await this.vectors.remove(EmbeddingSourceType.PORTFOLIO_PROJECT, id);
        return;
      }

      await this.vectors.upsert({
        sourceType: EmbeddingSourceType.PORTFOLIO_PROJECT,
        sourceId: project.id,
        scopeId: project.professionalId,
        text: lines(
          `Portfolio project: ${project.title}`,
          project.category && `Category: ${project.category.name}`,
          project.location && `Location: ${project.location}`,
          (project.budgetMin != null || project.budgetMax != null) &&
            `Budget: ${[money(project.budgetMin), money(project.budgetMax)].filter(Boolean).join(' – ')}`,
          project.completedAt &&
            `Completed: ${project.completedAt.toISOString().slice(0, 10)}`,
          project.description,
        ),
      });
    });
  }

  indexCertificate(id: string): Promise<void> {
    return this.safely(`certificate ${id}`, async () => {
      const certificate = await this.prisma.certificate.findUnique({
        where: { id },
      });
      if (!certificate) {
        await this.vectors.remove(EmbeddingSourceType.CERTIFICATE, id);
        return;
      }

      await this.vectors.upsert({
        sourceType: EmbeddingSourceType.CERTIFICATE,
        sourceId: certificate.id,
        scopeId: certificate.professionalId,
        text: lines(
          `Certificate: ${certificate.title}`,
          certificate.issuer && `Issued by: ${certificate.issuer}`,
          certificate.issueDate &&
            `Issued: ${certificate.issueDate.toISOString().slice(0, 10)}`,
          certificate.verified
            ? 'Verified by Synergi'
            : 'Not yet verified by Synergi',
        ),
      });
    });
  }

  indexReview(id: string): Promise<void> {
    return this.safely(`review ${id}`, async () => {
      const review = await this.prisma.review.findUnique({
        where: { id },
        include: { projectRequest: { select: { title: true } } },
      });
      if (!review) {
        await this.vectors.remove(EmbeddingSourceType.REVIEW, id);
        return;
      }

      await this.vectors.upsert({
        sourceType: EmbeddingSourceType.REVIEW,
        sourceId: review.id,
        scopeId: review.professionalId,
        text: lines(
          `Client review: ${review.rating}/5 stars`,
          review.projectRequest && `Project: ${review.projectRequest.title}`,
          review.comment,
          review.response && `Professional's response: ${review.response}`,
        ),
      });
    });
  }

  // Quotations are private to their professional: scope = professional id,
  // and they are only ever retrieved for that professional's own drafts.
  indexQuotation(id: string): Promise<void> {
    return this.safely(`quotation ${id}`, async () => {
      const quotation = await this.prisma.quotation.findUnique({
        where: { id },
        include: {
          items: true,
          projectRequest: { select: { title: true, description: true } },
        },
      });
      if (!quotation) {
        await this.vectors.remove(EmbeddingSourceType.QUOTATION, id);
        return;
      }

      await this.vectors.upsert({
        sourceType: EmbeddingSourceType.QUOTATION,
        sourceId: quotation.id,
        scopeId: quotation.professionalId,
        text: lines(
          quotation.projectRequest &&
            `Project: ${quotation.projectRequest.title}. ${quotation.projectRequest.description}`,
          ...quotation.items.map((item) => `Item: ${item.description}`),
          quotation.notes && `Notes: ${quotation.notes}`,
        ),
      });
    });
  }

  // ── Chat messages (scope = chat id) ─────────────────────────────────

  indexMessage(id: string): Promise<void> {
    return this.safely(`message ${id}`, async () => {
      const message = await this.prisma.message.findUnique({
        where: { id },
        include: { sender: { select: { firstName: true, role: true } } },
      });
      if (!message || message.type !== MessageType.TEXT || !message.content) {
        await this.vectors.remove(EmbeddingSourceType.MESSAGE, id);
        return;
      }

      await this.vectors.upsert({
        sourceType: EmbeddingSourceType.MESSAGE,
        sourceId: message.id,
        scopeId: message.chatId,
        text: `${message.sender.role === 'CLIENT' ? 'Client' : 'Professional'} ${message.sender.firstName}: ${message.content}`,
      });
    });
  }

  // ── Moderation cases (platform-wide, admin-only retrieval) ──────────

  indexReport(id: string): Promise<void> {
    return this.safely(`report ${id}`, async () => {
      const report = await this.prisma.report.findUnique({ where: { id } });
      if (!report) {
        await this.vectors.remove(EmbeddingSourceType.REPORT, id);
        return;
      }

      const target = await describeReportTarget(
        this.prisma,
        report.targetType,
        report.targetId,
      );
      await this.vectors.upsert({
        sourceType: EmbeddingSourceType.REPORT,
        sourceId: report.id,
        scopeId: null,
        text: lines(
          `Report about a ${report.targetType.toLowerCase().replace(/_/g, ' ')}`,
          `Reason: ${report.reason}`,
          target && `Reported content: ${target}`,
        ),
      });
    });
  }

  indexDispute(id: string): Promise<void> {
    return this.safely(`dispute ${id}`, async () => {
      const dispute = await this.prisma.dispute.findUnique({ where: { id } });
      if (!dispute) {
        await this.vectors.remove(EmbeddingSourceType.DISPUTE, id);
        return;
      }

      await this.vectors.upsert({
        sourceType: EmbeddingSourceType.DISPUTE,
        sourceId: dispute.id,
        scopeId: null,
        text: lines(`Dispute: ${dispute.reason}`, dispute.description),
      });
    });
  }

  // ── Help docs ───────────────────────────────────────────────────────

  async indexHelpDocs(): Promise<void> {
    await this.vectors.removeAllOfType(EmbeddingSourceType.HELP_DOC);
    for (const doc of HELP_DOCS) {
      await this.vectors.upsert({
        sourceType: EmbeddingSourceType.HELP_DOC,
        sourceId: doc.id,
        scopeId: null,
        text: `${doc.title}\n${doc.body}`,
      });
    }
    this.logger.log(`Indexed ${HELP_DOCS.length} help docs`);
  }

  // ── Full rebuild ────────────────────────────────────────────────────

  async reindexAll(): Promise<Record<string, number>> {
    const [
      profiles,
      services,
      portfolio,
      certificates,
      reviews,
      quotations,
      messages,
      reports,
      disputes,
    ] = await Promise.all([
      this.prisma.professionalProfile.findMany({ select: { id: true } }),
      this.prisma.service.findMany({ select: { id: true } }),
      this.prisma.portfolioProject.findMany({ select: { id: true } }),
      this.prisma.certificate.findMany({ select: { id: true } }),
      this.prisma.review.findMany({ select: { id: true } }),
      this.prisma.quotation.findMany({ select: { id: true } }),
      this.prisma.message.findMany({
        where: { type: MessageType.TEXT },
        select: { id: true },
      }),
      this.prisma.report.findMany({ select: { id: true } }),
      this.prisma.dispute.findMany({ select: { id: true } }),
    ]);

    // Sequential on purpose: embedding is CPU-bound, so parallelism wouldn't
    // speed it up, and it would hog the event loop for live requests.
    const run = async (
      rows: { id: string }[],
      index: (id: string) => Promise<void>,
    ) => {
      for (const row of rows) await index(row.id);
      return rows.length;
    };

    const counts = {
      professionalProfiles: await run(profiles, (id) =>
        this.indexProfessionalProfile(id),
      ),
      services: await run(services, (id) => this.indexService(id)),
      portfolioProjects: await run(portfolio, (id) =>
        this.indexPortfolioProject(id),
      ),
      certificates: await run(certificates, (id) => this.indexCertificate(id)),
      reviews: await run(reviews, (id) => this.indexReview(id)),
      quotations: await run(quotations, (id) => this.indexQuotation(id)),
      messages: await run(messages, (id) => this.indexMessage(id)),
      reports: await run(reports, (id) => this.indexReport(id)),
      disputes: await run(disputes, (id) => this.indexDispute(id)),
      helpDocs: HELP_DOCS.length,
    };
    await this.indexHelpDocs();
    return counts;
  }
}
