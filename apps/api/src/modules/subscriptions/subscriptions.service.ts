import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  type Subscription,
} from '../../../generated/prisma';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async getOrCreateForUser(userId: string) {
    const professionalId = await this.getProfessionalProfileId(userId);

    const existing = await this.prisma.subscription.findUnique({
      where: { professionalId },
    });
    if (existing) {
      return this.lapseIfExpired(existing);
    }

    return this.prisma.subscription.create({
      data: {
        professionalId,
        plan: SubscriptionPlan.BASIC,
        status: SubscriptionStatus.ACTIVE,
      },
    });
  }

  /**
   * No recurring billing exists (manual-payment flow, see synergi-phase10-status
   * memory), so a paid plan simply lapses back to BASIC once its period ends —
   * there is no auto-charge to renew it.
   */
  private async lapseIfExpired(
    subscription: Subscription,
  ): Promise<Subscription> {
    const isExpired =
      subscription.plan !== SubscriptionPlan.BASIC &&
      subscription.currentPeriodEnd !== null &&
      subscription.currentPeriodEnd.getTime() < Date.now();

    if (!isExpired) {
      return subscription;
    }

    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        plan: SubscriptionPlan.BASIC,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      },
    });
  }

  async getIdForUser(userId: string): Promise<string> {
    const subscription = await this.getOrCreateForUser(userId);
    return subscription.id;
  }

  async downgradeToBasic(userId: string) {
    const subscription = await this.getOrCreateForUser(userId);

    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        plan: SubscriptionPlan.BASIC,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      },
    });
  }
}
