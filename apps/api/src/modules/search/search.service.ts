import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AvailabilityStatus,
  ResponseTime,
} from '../../../generated/prisma';
import { MeilisearchService } from './meilisearch.service';
import type {
  ProfessionalSortBy,
  SearchProfessionalsDto,
} from './dto/search-professionals.dto';

const PROFILE_INDEX_INCLUDE = {
  user: { select: { firstName: true, lastName: true, avatarUrl: true } },
  category: { select: { name: true } },
  city: { select: { name: true } },
  skills: { include: { skill: { select: { id: true, name: true } } } },
} as const;

interface ProfessionalProfileForIndex {
  id: string;
  slug: string;
  businessName: string | null;
  tagline: string | null;
  about: string | null;
  coverImageUrl: string | null;
  categoryId: string | null;
  cityId: string | null;
  languages: string[];
  availability: AvailabilityStatus;
  responseTime: ResponseTime | null;
  hourlyRateMin: unknown;
  hourlyRateMax: unknown;
  verified: boolean;
  ratingAvg: unknown;
  ratingCount: number;
  completedProjectsCount: number;
  createdAt: Date;
  user: { firstName: string; lastName: string; avatarUrl: string | null };
  category: { name: string } | null;
  city: { name: string } | null;
  skills: { skillId: string; skill: { id: string; name: string } }[];
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly meilisearch: MeilisearchService,
  ) {}

  private buildDocument(
    profile: ProfessionalProfileForIndex,
  ): Record<string, unknown> {
    return {
      id: profile.id,
      slug: profile.slug,
      businessName: profile.businessName,
      tagline: profile.tagline,
      about: profile.about,
      coverImageUrl: profile.coverImageUrl,
      firstName: profile.user.firstName,
      lastName: profile.user.lastName,
      avatarUrl: profile.user.avatarUrl,
      categoryId: profile.categoryId,
      categoryName: profile.category?.name ?? null,
      cityId: profile.cityId,
      cityName: profile.city?.name ?? null,
      skillIds: profile.skills.map((entry) => entry.skillId),
      skills: profile.skills.map((entry) => entry.skill.name),
      languages: profile.languages,
      availability: profile.availability,
      responseTime: profile.responseTime,
      hourlyRateMin:
        profile.hourlyRateMin != null ? Number(profile.hourlyRateMin) : null,
      hourlyRateMax:
        profile.hourlyRateMax != null ? Number(profile.hourlyRateMax) : null,
      verified: profile.verified,
      ratingAvg: Number(profile.ratingAvg),
      ratingCount: profile.ratingCount,
      completedProjectsCount: profile.completedProjectsCount,
      createdAt: profile.createdAt.getTime(),
    };
  }

  async indexProfessionalById(id: string): Promise<void> {
    if (!this.meilisearch.isEnabled()) return;

    try {
      const profile = await this.prisma.professionalProfile.findUnique({
        where: { id },
        include: PROFILE_INDEX_INCLUDE,
      });
      if (!profile) return;

      await this.meilisearch.upsertProfessional(this.buildDocument(profile));
    } catch (error) {
      this.logger.warn(
        `Failed to index professional ${id}: ${(error as Error).message}`,
      );
    }
  }

  async reindexAll(): Promise<{ indexed: number }> {
    const profiles = await this.prisma.professionalProfile.findMany({
      include: PROFILE_INDEX_INCLUDE,
    });

    for (const profile of profiles) {
      await this.meilisearch.upsertProfessional(this.buildDocument(profile));
    }

    return { indexed: profiles.length };
  }

  private resolveSort(sortBy?: ProfessionalSortBy): string[] | undefined {
    switch (sortBy) {
      case 'rating':
        return ['ratingAvg:desc'];
      case 'newest':
        return ['createdAt:desc'];
      case 'priceAsc':
        return ['hourlyRateMin:asc'];
      case 'priceDesc':
        return ['hourlyRateMin:desc'];
      default:
        return undefined;
    }
  }

  async searchProfessionals(dto: SearchProfessionalsDto) {
    const filters: string[] = [];
    if (dto.categoryId) filters.push(`categoryId = "${dto.categoryId}"`);
    if (dto.cityId) filters.push(`cityId = "${dto.cityId}"`);
    if (dto.availability) filters.push(`availability = "${dto.availability}"`);
    if (dto.verifiedOnly) filters.push('verified = true');
    if (dto.minRating !== undefined)
      filters.push(`ratingAvg >= ${dto.minRating}`);
    if (dto.skillIds && dto.skillIds.length > 0) {
      filters.push(
        `(${dto.skillIds.map((id) => `skillIds = "${id}"`).join(' OR ')})`,
      );
    }

    const result = await this.meilisearch.searchProfessionals(dto.q ?? '', {
      filter: filters.length > 0 ? filters.join(' AND ') : undefined,
      sort: this.resolveSort(dto.sort),
      offset: dto.skip,
      limit: dto.limit,
    });

    const total = result.estimatedTotalHits ?? result.hits.length;

    return {
      items: result.hits,
      meta: {
        page: dto.page,
        limit: dto.limit,
        total,
        totalPages: Math.ceil(total / dto.limit),
      },
    };
  }
}
