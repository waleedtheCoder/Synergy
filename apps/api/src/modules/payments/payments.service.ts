import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination-query.dto';
import {
  CampaignStatus,
  PaymentStatus,
  PaymentType,
} from '../../../generated/prisma';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PLAN_PRICES } from '../subscriptions/plans';
import type { CreateSubscriptionPaymentDto } from './dto/create-subscription-payment.dto';
import type { CreateCampaignPaymentDto } from './dto/create-campaign-payment.dto';
import type { QueryMyPaymentsDto } from './dto/query-my-payments.dto';

const OPEN_CAMPAIGN_STATUSES: CampaignStatus[] = [
  CampaignStatus.DRAFT,
  CampaignStatus.PENDING_REVIEW,
  CampaignStatus.REJECTED,
];

export const PAYMENT_INSTRUCTIONS = {
  bankTransfer: {
    accountName: 'Synergi Marketplace Ltd (Demo)',
    accountNumber: 'DEMO-0000-1234-5678',
    bankName: 'Synergi Escrow Bank (Demo)',
    note: 'Include your payment reference in the transfer memo so we can match it.',
  },
  inPerson: {
    note: 'Visit any Synergi office during business hours and reference your payment ID.',
  },
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  getInstructions() {
    return PAYMENT_INSTRUCTIONS;
  }

  async findMine(userId: string, query: QueryMyPaymentsDto) {
    const where = {
      userId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          subscription: { select: { id: true, plan: true } },
          campaign: { select: { id: true, name: true } },
        },
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return paginate(items, total, query);
  }

  async createSubscriptionPayment(
    userId: string,
    dto: CreateSubscriptionPaymentDto,
  ) {
    const subscription =
      await this.subscriptionsService.getOrCreateForUser(userId);

    if (subscription.plan === dto.plan) {
      throw new BadRequestException('You are already on this plan');
    }

    const pending = await this.prisma.payment.findFirst({
      where: {
        subscriptionId: subscription.id,
        type: PaymentType.SUBSCRIPTION,
        status: PaymentStatus.PENDING,
      },
    });
    if (pending) {
      throw new BadRequestException(
        'You already have a pending subscription payment awaiting confirmation',
      );
    }

    return this.prisma.payment.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        type: PaymentType.SUBSCRIPTION,
        amount: PLAN_PRICES[dto.plan],
        method: dto.method,
        reference: dto.reference,
        targetPlan: dto.plan,
      },
    });
  }

  async createCampaignPayment(
    userId: string,
    campaignId: string,
    dto: CreateCampaignPaymentDto,
  ) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { advertiser: { select: { userId: true } } },
    });
    if (!campaign || campaign.advertiser.userId !== userId) {
      throw new NotFoundException('Campaign not found');
    }
    if (!OPEN_CAMPAIGN_STATUSES.includes(campaign.status)) {
      throw new BadRequestException('This campaign is not awaiting funding');
    }

    const existing = await this.prisma.payment.findFirst({
      where: {
        campaignId,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.SUCCEEDED] },
      },
    });
    if (existing) {
      throw new BadRequestException(
        'This campaign already has a pending or confirmed payment',
      );
    }

    return this.prisma.payment.create({
      data: {
        userId,
        campaignId,
        type: PaymentType.ADVERTISEMENT,
        amount: campaign.budget,
        method: dto.method,
        reference: dto.reference,
      },
    });
  }
}
