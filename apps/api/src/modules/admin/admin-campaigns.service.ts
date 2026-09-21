import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination-query.dto';
import { CampaignStatus, PaymentStatus } from '../../../generated/prisma';
import { expireOverdueCampaigns } from '../advertising/campaign-expiry.util';
import { AdminAuditLogService } from './admin-audit-log.service';
import type { QueryCampaignsDto } from '../advertising/dto/query-campaigns.dto';
import type { UpdateCampaignStatusDto } from './dto/update-campaign-status.dto';

const ALLOWED_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  DRAFT: [],
  PENDING_REVIEW: [CampaignStatus.ACTIVE, CampaignStatus.REJECTED],
  ACTIVE: [CampaignStatus.PAUSED, CampaignStatus.COMPLETED],
  PAUSED: [CampaignStatus.ACTIVE, CampaignStatus.COMPLETED],
  COMPLETED: [],
  REJECTED: [],
};

@Injectable()
export class AdminCampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AdminAuditLogService,
  ) {}

  async findAll(query: QueryCampaignsDto) {
    await expireOverdueCampaigns(this.prisma);
    const where = query.status ? { status: query.status } : {};

    const [items, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        include: {
          advertiser: {
            select: {
              companyName: true,
              user: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
        },
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder },
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return paginate(items, total, query);
  }

  async updateStatus(
    id: string,
    dto: UpdateCampaignStatusDto,
    adminId: string,
    ipAddress?: string,
  ) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (!ALLOWED_TRANSITIONS[campaign.status].includes(dto.status)) {
      throw new BadRequestException(
        `Cannot move a campaign from ${campaign.status} to ${dto.status}`,
      );
    }

    if (dto.status === CampaignStatus.ACTIVE) {
      const confirmedPayment = await this.prisma.payment.findFirst({
        where: { campaignId: id, status: PaymentStatus.SUCCEEDED },
      });
      if (!confirmedPayment) {
        throw new BadRequestException(
          'This campaign has no confirmed payment yet — confirm its funding payment first',
        );
      }
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: { status: dto.status },
    });

    await this.auditLog.log({
      adminId,
      action: 'campaign.status.update',
      targetType: 'campaign',
      targetId: id,
      metadata: { from: campaign.status, to: dto.status },
      ipAddress,
    });

    return updated;
  }
}
