import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { paginate } from '../../common/dto/pagination-query.dto';
import { AdminAuditLogService } from './admin-audit-log.service';
import {
  CampaignStatus,
  PaymentStatus,
  PaymentType,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../../../generated/prisma';
import type { QueryAdminPaymentsDto } from './dto/query-admin-payments.dto';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class AdminPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly auditLog: AdminAuditLogService,
  ) {}

  private async notify(
    paymentId: string,
    kind: 'confirmed' | 'rejected' | 'refunded',
  ): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: { select: { firstName: true, email: true } },
        subscription: { select: { plan: true } },
        campaign: { select: { name: true } },
      },
    });
    if (!payment) return;

    const description = payment.campaign
      ? `funding campaign "${payment.campaign.name}"`
      : `your ${payment.targetPlan ?? payment.subscription?.plan ?? ''} subscription`;
    const amount = Number(payment.amount).toFixed(2);

    if (kind === 'confirmed') {
      await this.mailService.sendPaymentConfirmedEmail(
        payment.user.email,
        payment.user.firstName,
        description,
        amount,
      );
    } else if (kind === 'rejected') {
      await this.mailService.sendPaymentRejectedEmail(
        payment.user.email,
        payment.user.firstName,
        description,
        amount,
      );
    } else {
      await this.mailService.sendPaymentRefundedEmail(
        payment.user.email,
        payment.user.firstName,
        description,
        amount,
      );
    }
  }

  async findAll(query: QueryAdminPaymentsDto) {
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
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

  private async getPendingPayment(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Only pending payments can be reviewed');
    }
    return payment;
  }

  async confirm(id: string, adminId: string, ipAddress?: string) {
    const payment = await this.getPendingPayment(id);

    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.SUCCEEDED,
        confirmedById: adminId,
        confirmedAt: new Date(),
      },
    });

    if (payment.type === PaymentType.SUBSCRIPTION && payment.subscriptionId) {
      await this.prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          plan: payment.targetPlan ?? undefined,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: new Date(Date.now() + THIRTY_DAYS_MS),
        },
      });
    }

    void this.notify(id, 'confirmed');
    await this.auditLog.log({
      adminId,
      action: 'payment.confirm',
      targetType: 'payment',
      targetId: id,
      metadata: { amount: payment.amount.toString(), type: payment.type },
      ipAddress,
    });
    return updated;
  }

  async reject(id: string, adminId: string, ipAddress?: string) {
    const payment = await this.getPendingPayment(id);

    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.FAILED,
        confirmedById: adminId,
        confirmedAt: new Date(),
      },
    });

    void this.notify(id, 'rejected');
    await this.auditLog.log({
      adminId,
      action: 'payment.reject',
      targetType: 'payment',
      targetId: id,
      metadata: { amount: payment.amount.toString(), type: payment.type },
      ipAddress,
    });
    return updated;
  }

  async refund(id: string, adminId: string, ipAddress?: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (payment.status !== PaymentStatus.SUCCEEDED) {
      throw new BadRequestException('Only succeeded payments can be refunded');
    }

    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.REFUNDED,
        confirmedById: adminId,
        confirmedAt: new Date(),
      },
    });

    if (payment.type === PaymentType.SUBSCRIPTION && payment.subscriptionId) {
      await this.prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          plan: SubscriptionPlan.BASIC,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        },
      });
    }

    if (payment.type === PaymentType.ADVERTISEMENT && payment.campaignId) {
      await this.prisma.campaign.updateMany({
        where: {
          id: payment.campaignId,
          status: { in: [CampaignStatus.ACTIVE, CampaignStatus.PAUSED] },
        },
        data: { status: CampaignStatus.COMPLETED },
      });
    }

    void this.notify(id, 'refunded');
    await this.auditLog.log({
      adminId,
      action: 'payment.refund',
      targetType: 'payment',
      targetId: id,
      metadata: { amount: payment.amount.toString(), type: payment.type },
      ipAddress,
    });
    return updated;
  }
}
