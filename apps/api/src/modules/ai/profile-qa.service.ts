import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingSourceType } from '../../../generated/prisma';
import { VectorStoreService } from './vector-store.service';
import { LlmService } from './llm.service';
import { PROFESSIONAL_CONTENT_TYPES } from './matching.service';
import {
  renderSources,
  snippet,
  UNTRUSTED_DATA_RULE,
  type PromptSource,
} from './prompts';

const SOURCE_LIMIT = 8;

const LABELS: Partial<Record<EmbeddingSourceType, string>> = {
  [EmbeddingSourceType.PROFESSIONAL_PROFILE]: 'Profile',
  [EmbeddingSourceType.SERVICE]: 'Service',
  [EmbeddingSourceType.PORTFOLIO_PROJECT]: 'Portfolio project',
  [EmbeddingSourceType.CERTIFICATE]: 'Certificate',
  [EmbeddingSourceType.REVIEW]: 'Client review',
};

@Injectable()
export class ProfileQaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vectors: VectorStoreService,
    private readonly llm: LlmService,
  ) {}

  async ask(professionalId: string, question: string) {
    const profile = await this.prisma.professionalProfile.findUnique({
      where: { id: professionalId },
      select: {
        id: true,
        businessName: true,
        ratingAvg: true,
        ratingCount: true,
        completedProjectsCount: true,
        verified: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });
    if (!profile) throw new NotFoundException('Professional not found');

    const hits = await this.vectors.search(question, {
      sourceTypes: PROFESSIONAL_CONTENT_TYPES,
      scopeIds: [profile.id],
      limit: SOURCE_LIMIT,
    });

    const sources: PromptSource[] = hits.map((hit, index) => ({
      n: index + 1,
      label: LABELS[hit.sourceType] ?? hit.sourceType,
      text: hit.content,
    }));

    const name =
      profile.businessName ??
      `${profile.user.firstName} ${profile.user.lastName}`;
    // Platform-computed stats are trustworthy (not user-written), so they go
    // outside the <source> tags.
    const stats = [
      `Average rating: ${Number(profile.ratingAvg).toFixed(1)}/5 from ${profile.ratingCount} review(s)`,
      `Completed projects on Synergi: ${profile.completedProjectsCount}`,
      `Verified by Synergi: ${profile.verified ? 'yes' : 'no'}`,
    ].join('\n');

    const answer = await this.llm.generateText({
      effort: 'low',
      system: [
        `You answer visitors' questions about one construction professional on Synergi: ${name}.`,
        "Answer only from the platform stats and the numbered sources from this professional's public profile. If they don't contain the answer, say so plainly and suggest messaging the professional — never guess or use outside knowledge about them.",
        'Cite the sources you use inline as [1], [2], etc. Keep answers short (under 120 words), factual, and neutral — you are not the professional and should not sell on their behalf.',
        'Use plain text only, no markdown headings or bullet lists.',
        UNTRUSTED_DATA_RULE,
      ].join('\n'),
      prompt: `<platform_stats>\n${stats}\n</platform_stats>\n\n${sources.length > 0 ? renderSources(sources) : '(This profile has no indexed content yet.)'}\n\n<question>\n${question}\n</question>`,
    });

    return {
      answer,
      sources: sources.map((source) => ({
        n: source.n,
        label: source.label,
        snippet: snippet(source.text),
      })),
    };
  }
}
