import { apiClient } from "@/lib/api-client";
import type { PlanDefinition, Subscription } from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function fetchPlans() {
  const { data } = await apiClient.get<ApiEnvelope<PlanDefinition[]>>("/subscriptions/plans");
  return data.data;
}

export async function fetchMySubscription() {
  const { data } = await apiClient.get<ApiEnvelope<Subscription>>("/subscriptions/me");
  return data.data;
}

export async function downgradeToBasic() {
  const { data } = await apiClient.post<ApiEnvelope<Subscription>>(
    "/subscriptions/me/downgrade-to-basic",
  );
  return data.data;
}
