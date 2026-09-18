import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsEventType, type Prisma } from '../../../generated/prisma';

const EVENT_TYPES = Object.values(AnalyticsEventType);

type Totals = Record<AnalyticsEventType, number>;

function emptyTotals(): Totals {
  return EVENT_TYPES.reduce(
    (acc, type) => ({ ...acc, [type]: 0 }),
    {} as Totals,
  );
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async track(
    professionalId: string,
    type: AnalyticsEventType,
    meta?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.prisma.analyticsEvent.create({
        data: { professionalId, type, meta: meta as Prisma.InputJsonValue },
      });
    } catch (error) {
      this.logger.warn(`Failed to record analytics event: ${String(error)}`);
    }
  }

  async trackMany(
    professionalIds: string[],
    type: AnalyticsEventType,
  ): Promise<void> {
    if (professionalIds.length === 0) return;
    try {
      await this.prisma.analyticsEvent.createMany({
        data: professionalIds.map((professionalId) => ({
          professionalId,
          type,
        })),
      });
    } catch (error) {
      this.logger.warn(`Failed to record analytics events: ${String(error)}`);
    }
  }

  private async getProfessionalProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.professionalProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) {
      throw new NotFoundException('Professional profile not found');
    }
    return profile.id;
  }

  async getMySummary(userId: string, days: number) {
    const professionalId = await this.getProfessionalProfileId(userId);
    return this.buildSummary({ professionalId }, days);
  }

  private async buildSummary(where: { professionalId?: string }, days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const events = await this.prisma.analyticsEvent.findMany({
      where: { ...where, createdAt: { gte: since } },
      select: { type: true, createdAt: true },
    });

    const totals = emptyTotals();
    const seriesMap = new Map<string, Totals>();

    for (const event of events) {
      totals[event.type] += 1;

      const day = event.createdAt.toISOString().slice(0, 10);
      if (!seriesMap.has(day)) {
        seriesMap.set(day, emptyTotals());
      }
      seriesMap.get(day)![event.type] += 1;
    }

    const series = Array.from(seriesMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));

    return { totals, series, rangeDays: days };
  }

  async getAdminSummary(days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [platform, topRaw] = await Promise.all([
      this.buildSummary({}, days),
      this.prisma.analyticsEvent.groupBy({
        by: ['professionalId'],
        where: {
          createdAt: { gte: since },
          type: AnalyticsEventType.PROFILE_VIEW,
        },
        _count: { professionalId: true },
        orderBy: { _count: { professionalId: 'desc' } },
        take: 5,
      }),
    ]);

    const professionals = await this.prisma.professionalProfile.findMany({
      where: { id: { in: topRaw.map((row) => row.professionalId) } },
      select: {
        id: true,
        slug: true,
        businessName: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });
    const byId = new Map(professionals.map((p) => [p.id, p]));

    const topProfessionals = topRaw
      .map((row) => {
        const professional = byId.get(row.professionalId);
        if (!professional) return null;
        return { ...professional, views: row._count.professionalId };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    return { ...platform, topProfessionals };
  }
}
