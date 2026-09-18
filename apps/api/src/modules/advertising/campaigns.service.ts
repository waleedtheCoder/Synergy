import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination-query.dto';
import { CampaignStatus } from '../../../generated/prisma';
import { AdvertisersService } from './advertisers.service';
import { expireOverdueCampaigns } from './campaign-expiry.util';
import type { CreateCampaignDto } from './dto/create-campaign.dto';
import type { UpdateCampaignDto } from './dto/update-campaign.dto';
import type { QueryCampaignsDto } from './dto/query-campaigns.dto';

const EDITABLE_STATUSES: CampaignStatus[] = [
  CampaignStatus.DRAFT,
  CampaignStatus.REJECTED,
];

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly advertisersService: AdvertisersService,
  ) {}

  private assertDateRange(startDate: string, endDate: string): void {
    if (new Date(endDate).getTime() <= new Date(startDate).getTime()) {
      throw new BadRequestException('endDate must be after startDate');
    }
  }

  private async getOwnedCampaign(advertiserId: string, id: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign || campaign.advertiserId !== advertiserId) {
      throw new NotFoundException('Campaign not found');
    }
    return campaign;
  }

  async create(userId: string, dto: CreateCampaignDto) {
    const advertiserId = await this.advertisersService.getAdvertiserId(userId);
    this.assertDateRange(dto.startDate, dto.endDate);

    if (dto.professionalId) {
      const professional = await this.prisma.professionalProfile.findUnique({
        where: { id: dto.professionalId },
        select: { userId: true },
      });
      if (!professional || professional.userId !== userId) {
        throw new BadRequestException(
          'You can only boost your own professional profile',
        );
      }
    }

    const campaign = await this.prisma.campaign.create({
      data: {
        advertiserId,
        name: dto.name,
        placement: dto.placement,
        bannerImageUrl: dto.bannerImageUrl,
        targetUrl: dto.targetUrl,
        budget: dto.budget,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });

    if (dto.professionalId) {
      await this.prisma.sponsoredListing.create({
        data: { campaignId: campaign.id, professionalId: dto.professionalId },
      });
    }

    return campaign;
  }

  async findMine(userId: string, query: QueryCampaignsDto) {
    await expireOverdueCampaigns(this.prisma);
    const advertiserId = await this.advertisersService.getAdvertiserId(userId);
    const where = {
      advertiserId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        include: { payments: { select: { status: true } } },
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder },
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return paginate(items, total, query);
  }

  async findOneMine(userId: string, id: string) {
    const advertiserId = await this.advertisersService.getAdvertiserId(userId);
    return this.getOwnedCampaign(advertiserId, id);
  }

  async update(userId: string, id: string, dto: UpdateCampaignDto) {
    const advertiserId = await this.advertisersService.getAdvertiserId(userId);
    const campaign = await this.getOwnedCampaign(advertiserId, id);

    if (!EDITABLE_STATUSES.includes(campaign.status)) {
      throw new BadRequestException(
        'Only draft or rejected campaigns can be edited',
      );
    }

    const startDate = dto.startDate ?? campaign.startDate.toISOString();
    const endDate = dto.endDate ?? campaign.endDate.toISOString();
    this.assertDateRange(startDate, endDate);

    return this.prisma.campaign.update({
      where: { id },
      data: {
        name: dto.name,
        placement: dto.placement,
        bannerImageUrl: dto.bannerImageUrl,
        targetUrl: dto.targetUrl,
        budget: dto.budget,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    const advertiserId = await this.advertisersService.getAdvertiserId(userId);
    const campaign = await this.getOwnedCampaign(advertiserId, id);

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException('Only draft campaigns can be deleted');
    }

    await this.prisma.campaign.delete({ where: { id } });
  }

  async submit(userId: string, id: string) {
    const advertiserId = await this.advertisersService.getAdvertiserId(userId);
    const campaign = await this.getOwnedCampaign(advertiserId, id);

    if (!EDITABLE_STATUSES.includes(campaign.status)) {
      throw new BadRequestException(
        'Only draft or rejected campaigns can be submitted for review',
      );
    }

    return this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.PENDING_REVIEW },
    });
  }

  async pause(userId: string, id: string) {
    const advertiserId = await this.advertisersService.getAdvertiserId(userId);
    const campaign = await this.getOwnedCampaign(advertiserId, id);

    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new BadRequestException('Only active campaigns can be paused');
    }

    return this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.PAUSED },
    });
  }

  async resume(userId: string, id: string) {
    const advertiserId = await this.advertisersService.getAdvertiserId(userId);
    const campaign = await this.getOwnedCampaign(advertiserId, id);

    if (campaign.status !== CampaignStatus.PAUSED) {
      throw new BadRequestException('Only paused campaigns can be resumed');
    }
    if (Number(campaign.spend) >= Number(campaign.budget)) {
      throw new BadRequestException('This campaign has used its full budget');
    }
    if (campaign.endDate.getTime() < Date.now()) {
      throw new BadRequestException('This campaign has already ended');
    }

    return this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.ACTIVE },
    });
  }

  async stop(userId: string, id: string) {
    const advertiserId = await this.advertisersService.getAdvertiserId(userId);
    const campaign = await this.getOwnedCampaign(advertiserId, id);

    if (
      campaign.status !== CampaignStatus.ACTIVE &&
      campaign.status !== CampaignStatus.PAUSED
    ) {
      throw new BadRequestException(
        'Only active or paused campaigns can be stopped',
      );
    }

    return this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.COMPLETED },
    });
  }
}
