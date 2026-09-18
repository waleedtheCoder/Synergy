import type { SubscriptionPlan, SubscriptionStatus } from "@synergi/shared-types";

export interface PlanDefinition {
  plan: SubscriptionPlan;
  name: string;
  priceMonthly: number;
  features: string[];
}

export interface Subscription {
  id: string;
  professionalId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export type { SubscriptionPlan, SubscriptionStatus };
