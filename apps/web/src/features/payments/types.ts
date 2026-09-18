import type {
  PaymentType,
  PaymentStatus,
  PaymentMethod,
  SubscriptionPlan,
} from "@synergi/shared-types";

export interface PaymentInstructions {
  bankTransfer: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    note: string;
  };
  inPerson: {
    note: string;
  };
}

export interface Payment {
  id: string;
  userId: string;
  subscriptionId: string | null;
  campaignId: string | null;
  type: PaymentType;
  status: PaymentStatus;
  amount: string;
  currency: string;
  method: PaymentMethod;
  reference: string | null;
  targetPlan: SubscriptionPlan | null;
  confirmedAt: string | null;
  createdAt: string;
  subscription: { id: string; plan: SubscriptionPlan } | null;
  campaign: { id: string; name: string } | null;
}

export type { PaymentType, PaymentStatus, PaymentMethod };
