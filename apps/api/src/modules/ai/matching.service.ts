import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AvailabilityStatus,
  EmbeddingSourceType,
  UserStatus,
} from '../../../generated/prisma';
import { MeilisearchService } from '../search/meilisearch.service';
import { VectorStoreService, type VectorMatch } from './vector-store.service';
import { LlmService } from './llm.service';
import {
  renderSources,
  snippet,
  UNTRUSTED_DATA_RULE,
  type PromptSource,
} from './prompts';

export const PROFESSIONAL_CONTENT_TYPES: EmbeddingSourceType[] = [
  EmbeddingSourceType.PROFESSIONAL_PROFILE,
  EmbeddingSourceType.SERVICE,
  EmbeddingSourceType.PORTFOLIO_PROJECT,
  EmbeddingSourceType.CERTIFICATE,
  EmbeddingSourceType.REVIEW,
];

const MATCH_COUNT = 5;
const EVIDENCE_PER_MATCH = 4;
// Reciprocal-rank-fusion constant (the standard value from the RRF paper).
const RRF_K = 60;
const CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;

const MatchExplanationSchema = z.object({
  matches: z.array(
    z.object({
      professionalId: z.string(),
      fit: z.enum(['strong', 'good', 'partial', 'weak']),
      summary: z.string(),
      highlights: z.array(z.string()),
      considerations: z.array(z.string()),
    }),
  ),
});

const PROFESSIONAL_CARD_SELECT = {
  id: true,
  slug: true,
  businessName: true,
  tagline: true,
  ratingAvg: true,
  ratingCount: true,
  verified: true,
  availability: true,
  categoryId: true,
  user: { select: { firstName: true, lastName: true, avatarUrl: true } },
  category: { select: { name: true } },
  city: { select: { name: true } },
} as const;

function sourceTypeLabel(type: EmbeddingSourceType): string {
  switch (type) {
    case EmbeddingSourceType.PROFESSIONAL_PROFILE:
      return 'Profile';
    case EmbeddingSourceType.SERVICE:
      return 'Service';
    case EmbeddingSourceType.PORTFOLIO_PROJECT:
      return 'Portfolio project';
    case EmbeddingSourceType.CERTIFICATE:
      return 'Certificate';
    case EmbeddingSourceType.REVIEW:
      return 'Client review';
    default:
      return type;
  }
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);
  private readonly cache = new Map<
    string,
    { expiresAt: number; result: unknown }
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly vectors: VectorStoreService,
    private readonly meilisearch: MeilisearchService,
    private readonly llm: LlmService,
  ) {}

  private async getOwnedRequest(userId: string, requestId: string) {
    const request = await this.prisma.projectRequest.findUnique({
      where: { id: requestId },
      include: {
        client: { select: { userId: true } },
        category: { select: { name: true } },
        city: { select: { name: true } },
      },
    });
    if (!request || request.client.userId !== userId) {
      throw new NotFoundException('Project request not found');
    }
    return request;
  }

  async matchProfessionals(userId: string, requestId: string) {
    const request = await this.getOwnedRequest(userId, requestId);

    const cacheKey = `${request.id}:${request.updatedAt.getTime()}:${this.llm.isEnabled()}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.result;

    const requestText = [
      request.title,
      request.description,
      request.category && `Category: ${request.category.name}`,
      request.city && `Location: ${request.city.name}`,
    ]
      .filter(Boolean)
      .join('\n');

    // ── 1. Retrieve: semantic (pgvector) + keyword (Meilisearch) ───────
    const vectorHits = await this.vectors.search(requestText, {
      sourceTypes: PROFESSIONAL_CONTENT_TYPES,
      limit: 300,
    });

    const evidenceByPro = new Map<string, VectorMatch[]>();
    for (const hit of vectorHits) {
      if (!hit.scopeId) continue;
      const list = evidenceByPro.get(hit.scopeId) ?? [];
      list.push(hit);
      evidenceByPro.set(hit.scopeId, list);
    }

    // A professional's semantic score rewards one very relevant item plus
    // breadth of relevant work (hits arrive sorted by similarity).
    const semanticRanking = [...evidenceByPro.entries()]
      .map(([professionalId, hits]) => {
        const top = hits.slice(0, 3).map((hit) => hit.similarity);
        const breadth = top.reduce((sum, value) => sum + value, 0) / top.length;
        return { professionalId, score: top[0] * 0.6 + breadth * 0.4 };
      })
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.professionalId);

    const keywordRanking = await this.keywordRanking(request.title);

    // ── 2. Fuse rankings, then filter to eligible professionals ────────
    const fused = new Map<string, number>();
    const addRanking = (ranking: string[]) =>
      ranking.forEach((id, rank) =>
        fused.set(id, (fused.get(id) ?? 0) + 1 / (RRF_K + rank + 1)),
      );
    addRanking(semanticRanking.slice(0, 50));
    addRanking(keywordRanking);

    const candidateIds = [...fused.keys()];
    if (candidateIds.length === 0) {
      return this.remember(cacheKey, { aiExplained: false, matches: [] });
    }

    const professionals = await this.prisma.professionalProfile.findMany({
      where: {
        id: { in: candidateIds },
        availability: { not: AvailabilityStatus.UNAVAILABLE },
        user: { status: UserStatus.ACTIVE, deletedAt: null },
      },
      select: PROFESSIONAL_CARD_SELECT,
    });

    const categoryBoost = 0.25 / (RRF_K + 1);
    const ranked = professionals
      .map((professional) => ({
        professional,
        score:
          (fused.get(professional.id) ?? 0) +
          (request.categoryId && professional.categoryId === request.categoryId
            ? categoryBoost
            : 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, MATCH_COUNT);

    // ── 3. Gather evidence for the shortlisted professionals ───────────
    const shortlist = await Promise.all(
      ranked.map(async ({ professional }) => {
        let evidence = (evidenceByPro.get(professional.id) ?? []).slice(
          0,
          EVIDENCE_PER_MATCH,
        );
        if (evidence.length === 0) {
          // Keyword-only match: pull its most relevant content directly.
          evidence = await this.vectors.search(requestText, {
            sourceTypes: PROFESSIONAL_CONTENT_TYPES,
            scopeIds: [professional.id],
            limit: EVIDENCE_PER_MATCH,
          });
        }
        return { professional, evidence };
      }),
    );

    // ── 4. Generate: explain each match from its evidence ──────────────
    const explanations = await this.explain(requestText, shortlist);

    const result = {
      aiExplained: explanations !== null,
      matches: shortlist.map(({ professional, evidence }) => {
        const explanation = explanations?.get(professional.id);
        return {
          professional,
          fit: explanation?.fit ?? null,
          summary: explanation?.summary ?? null,
          highlights: explanation?.highlights ?? [],
          considerations: explanation?.considerations ?? [],
          evidence: evidence.map((hit) => ({
            type: hit.sourceType,
            label: sourceTypeLabel(hit.sourceType),
            snippet: snippet(hit.content),
          })),
        };
      }),
    };
    return this.remember(cacheKey, result);
  }

  private async keywordRanking(query: string): Promise<string[]> {
    if (!this.meilisearch.isEnabled()) return [];
    try {
      const result = await this.meilisearch.searchProfessionals(query, {
        limit: 20,
      });
      return result.hits.map((hit) => String(hit.id));
    } catch (error) {
      this.logger.warn(
        `Keyword retrieval skipped: ${(error as Error).message}`,
      );
      return [];
    }
  }

  private async explain(
    requestText: string,
    shortlist: {
      professional: {
        id: string;
        businessName: string | null;
        user: { firstName: string; lastName: string };
      };
      evidence: VectorMatch[];
    }[],
  ) {
    if (!this.llm.isEnabled() || shortlist.length === 0) return null;

    let n = 0;
    const candidateBlocks = shortlist.map(({ professional, evidence }) => {
      const name =
        professional.businessName ??
        `${professional.user.firstName} ${professional.user.lastName}`;
      const sources: PromptSource[] = evidence.map((hit) => ({
        n: ++n,
        label: sourceTypeLabel(hit.sourceType),
        text: hit.content,
      }));
      return `<candidate professionalId="${professional.id}" name="${name.replace(/"/g, "'")}">\n${renderSources(sources)}\n</candidate>`;
    });

    const parsed = await this.llm.generateStructured(MatchExplanationSchema, {
      effort: 'medium',
      system: [
        'You help clients on Synergi, a construction marketplace, understand why professionals were recommended for their project.',
        'For each candidate, judge how well their evidence fits the project and explain it to the client in plain language.',
        '- summary: one or two sentences on why this professional fits (or does not).',
        '- highlights: up to 3 short, specific points grounded in the evidence (e.g. a similar past project, a relevant certificate, what reviewers praised).',
        '- considerations: up to 2 short points the client should check or that are missing from the evidence. Empty if nothing notable.',
        '- fit: strong / good / partial / weak. Be honest — a weak fit should say so.',
        'Only use facts present in the candidate\'s sources. Do not invent experience, prices, or credentials. Address the client as "you".',
        'Return one entry per candidate, using the exact professionalId given.',
        UNTRUSTED_DATA_RULE,
      ].join('\n'),
      prompt: `<project_request>\n${requestText}\n</project_request>\n\n${candidateBlocks.join('\n\n')}`,
    });

    return new Map(
      parsed.matches.map((match) => [match.professionalId, match]),
    );
  }

  private remember<T>(key: string, result: T): T {
    if (this.cache.size >= CACHE_MAX_ENTRIES) {
      // Maps iterate in insertion order: evict the oldest entry.
      for (const oldest of this.cache.keys()) {
        this.cache.delete(oldest);
        break;
      }
    }
    this.cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, result });
    return result;
  }
}
