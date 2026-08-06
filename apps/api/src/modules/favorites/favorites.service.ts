import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination-query.dto';
import type { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

const PROFESSIONAL_SUMMARY = {
  select: {
    id: true,
    slug: true,
    businessName: true,
    tagline: true,
    ratingAvg: true,
    ratingCount: true,
    user: {
      select: { firstName: true, lastName: true, avatarUrl: true },
    },
    category: { select: { id: true, name: true } },
  },
} as const;

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  private async getClientProfileId(userId: string): Promise<string> {
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!clientProfile) {
      throw new NotFoundException('Client profile not found');
    }

    return clientProfile.id;
  }

  async findMine(userId: string, query: PaginationQueryDto) {
    const clientId = await this.getClientProfileId(userId);

    const [items, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { clientId },
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder },
        select: { createdAt: true, professional: PROFESSIONAL_SUMMARY },
      }),
      this.prisma.favorite.count({ where: { clientId } }),
    ]);

    return paginate(
      items.map((item) => ({
        favoritedAt: item.createdAt,
        ...item.professional,
      })),
      total,
      query,
    );
  }

  async add(userId: string, professionalId: string) {
    const clientId = await this.getClientProfileId(userId);

    const professional = await this.prisma.professionalProfile.findUnique({
      where: { id: professionalId },
      select: { id: true },
    });
    if (!professional) {
      throw new NotFoundException('Professional not found');
    }

    await this.prisma.favorite.upsert({
      where: { clientId_professionalId: { clientId, professionalId } },
      create: { clientId, professionalId },
      update: {},
    });
  }

  async remove(userId: string, professionalId: string): Promise<void> {
    const clientId = await this.getClientProfileId(userId);

    await this.prisma.favorite.deleteMany({
      where: { clientId, professionalId },
    });
  }
}
