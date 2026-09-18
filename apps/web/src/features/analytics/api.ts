import { apiClient } from "@/lib/api-client";
import type { AnalyticsSummary, AdminAnalyticsSummary } from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function fetchMyAnalytics(days: number) {
  const { data } = await apiClient.get<ApiEnvelope<AnalyticsSummary>>("/analytics/me", {
    params: { days },
  });
  return data.data;
}

export async function fetchAdminAnalytics(days: number) {
  const { data } = await apiClient.get<ApiEnvelope<AdminAnalyticsSummary>>("/admin/analytics", {
    params: { days },
  });
  return data.data;
}

export async function recordProfessionalClick(id: string) {
  await apiClient.post<ApiEnvelope<null>>(`/professionals/${id}/click`);
}
