import { apiClient } from "@/lib/api-client";
import type { PaginatedResult } from "@/lib/pagination";
import type { SubscriptionPlan, PaymentStatus, PaymentMethod } from "@synergi/shared-types";
import type { Payment, PaymentInstructions } from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function fetchPaymentInstructions() {
  const { data } = await apiClient.get<ApiEnvelope<PaymentInstructions>>("/payments/instructions");
  return data.data;
}

export async function fetchMyPayments(params: { page?: number; status?: PaymentStatus }) {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<Payment>>>("/payments/me", {
    params,
  });
  return data.data;
}

export async function createSubscriptionPayment(input: {
  plan: SubscriptionPlan;
  method: PaymentMethod;
  reference?: string;
}) {
  const { data } = await apiClient.post<ApiEnvelope<Payment>>(
    "/payments/subscription-upgrade",
    input,
  );
  return data.data;
}

export async function createCampaignPayment(
  campaignId: string,
  input: { method: PaymentMethod; reference?: string },
) {
  const { data } = await apiClient.post<ApiEnvelope<Payment>>(
    `/payments/campaigns/${campaignId}`,
    input,
  );
  return data.data;
}
