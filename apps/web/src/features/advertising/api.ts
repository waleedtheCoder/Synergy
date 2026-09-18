import { apiClient } from "@/lib/api-client";
import type { PaginatedResult } from "@/lib/pagination";
import type { Advertiser, Campaign, ServedAd, AdPlacement, CampaignStatus } from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface CreateCampaignInput {
  name: string;
  placement: AdPlacement;
  bannerImageUrl: string;
  targetUrl: string;
  budget: number;
  startDate: string;
  endDate: string;
}

export async function fetchMyAdvertiser() {
  const { data } = await apiClient.get<ApiEnvelope<Advertiser>>("/advertisers/me");
  return data.data;
}

export async function createAdvertiser(input: { companyName: string; billingEmail?: string }) {
  const { data } = await apiClient.post<ApiEnvelope<Advertiser>>("/advertisers", input);
  return data.data;
}

export async function fetchMyCampaigns(params: { page?: number; status?: CampaignStatus }) {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<Campaign>>>("/campaigns/me", {
    params,
  });
  return data.data;
}

export async function createCampaign(input: CreateCampaignInput) {
  const { data } = await apiClient.post<ApiEnvelope<Campaign>>("/campaigns/me", input);
  return data.data;
}

export async function submitCampaign(id: string) {
  const { data } = await apiClient.post<ApiEnvelope<Campaign>>(`/campaigns/me/${id}/submit`);
  return data.data;
}

export async function pauseCampaign(id: string) {
  const { data } = await apiClient.post<ApiEnvelope<Campaign>>(`/campaigns/me/${id}/pause`);
  return data.data;
}

export async function resumeCampaign(id: string) {
  const { data } = await apiClient.post<ApiEnvelope<Campaign>>(`/campaigns/me/${id}/resume`);
  return data.data;
}

export async function stopCampaign(id: string) {
  const { data } = await apiClient.post<ApiEnvelope<Campaign>>(`/campaigns/me/${id}/stop`);
  return data.data;
}

export async function deleteCampaign(id: string) {
  await apiClient.delete<ApiEnvelope<null>>(`/campaigns/me/${id}`);
}

export async function fetchServedAd(placement: AdPlacement) {
  const { data } = await apiClient.get<ApiEnvelope<ServedAd | null>>("/ads/serve", {
    params: { placement },
  });
  return data.data;
}

export async function recordAdClick(id: string) {
  const { data } = await apiClient.post<ApiEnvelope<{ targetUrl: string }>>(`/ads/${id}/click`);
  return data.data;
}
