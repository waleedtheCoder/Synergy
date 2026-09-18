import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AdEventType,
  AdPlacement,
  CampaignStatus,
} from '../../../generated/prisma';

const COST_PER_IMPRESSION = 0.05;
const COST_PER_CLICK = 0.75;

@Injectable()
export class AdsService {
  constructor(private readonly prisma: PrismaService) {}

  private async completeIfBudgetExhausted(
    id: string,
    spend: unknown,
    budget: unknown,
  ): Promise<void> {
    if (Number(spend) >= Number(budget)) {
      await this.prisma.campaign.updateMany({
        where: { id, status: CampaignStatus.ACTIVE },
        data: { status: CampaignStatus.COMPLETED },
      });
    }
  }

  async serve(placement: AdPlacement) {
    const now = new Date();
    const eligible = await this.prisma.campaign.findMany({
      where: {
        placement,
        status: CampaignStatus.ACTIVE,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      select: { id: true, bannerImageUrl: true, targetUrl: true },
    });

    if (eligible.length === 0) {
      return null;
    }

    const chosen = eligible[Math.floor(Math.random() * eligible.length)];

    const updated = await this.prisma.campaign.update({
      where: { id: chosen.id },
      data: {
        impressions: { increment: 1 },
        spend: { increment: COST_PER_IMPRESSION },
      },
      select: { spend: true, budget: true },
    });

    await this.prisma.adEvent.create({
      data: { campaignId: chosen.id, type: AdEventType.IMPRESSION },
    });

    await this.completeIfBudgetExhausted(
      chosen.id,
      updated.spend,
      updated.budget,
    );

    return chosen;
  }

  async recordClick(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, targetUrl: true },
    });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const updated = await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        clicks: { increment: 1 },
        spend: { increment: COST_PER_CLICK },
      },
      select: { spend: true, budget: true },
    });

    await this.prisma.adEvent.create({
      data: { campaignId, type: AdEventType.CLICK },
    });

    await this.completeIfBudgetExhausted(
      campaignId,
      updated.spend,
      updated.budget,
    );

    return { targetUrl: campaign.targetUrl };
  }
}
