import { SubscriptionPlan } from '../../../generated/prisma';

export interface PlanDefinition {
  plan: SubscriptionPlan;
  name: string;
  priceMonthly: number;
  features: string[];
}

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    plan: SubscriptionPlan.BASIC,
    name: 'Basic',
    priceMonthly: 0,
    features: [
      'Public profile',
      'Up to 3 portfolio projects',
      'Standard search ranking',
    ],
  },
  {
    plan: SubscriptionPlan.PROFESSIONAL,
    name: 'Professional',
    priceMonthly: 29,
    features: [
      'Unlimited portfolio projects',
      'Priority search ranking',
      'Verified badge eligibility',
    ],
  },
  {
    plan: SubscriptionPlan.BUSINESS,
    name: 'Business',
    priceMonthly: 79,
    features: [
      'Everything in Professional',
      'Featured placement in category pages',
      'Team seats (coming soon)',
    ],
  },
  {
    plan: SubscriptionPlan.ENTERPRISE,
    name: 'Enterprise',
    priceMonthly: 199,
    features: [
      'Everything in Business',
      'Dedicated account support',
      'Custom analytics',
    ],
  },
];

export const PLAN_PRICES: Record<SubscriptionPlan, number> =
  PLAN_DEFINITIONS.reduce(
    (acc, def) => ({ ...acc, [def.plan]: def.priceMonthly }),
    {} as Record<SubscriptionPlan, number>,
  );
