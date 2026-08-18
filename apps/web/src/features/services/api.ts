import { apiClient } from "@/lib/api-client";
import type { PaginatedResult } from "@/lib/pagination";
import type { Service } from "./types";
import type { ServicePayload } from "./schemas";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function fetchMyServices(params: { page?: number }) {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<Service>>>("/services/me", {
    params,
  });
  return data.data;
}

export async function createService(input: ServicePayload) {
  const { data } = await apiClient.post<ApiEnvelope<Service>>("/services", input);
  return data.data;
}

export async function updateService(id: string, input: Partial<ServicePayload> & { active?: boolean }) {
  const { data } = await apiClient.patch<ApiEnvelope<Service>>(`/services/${id}`, input);
  return data.data;
}

export async function deleteService(id: string) {
  await apiClient.delete<ApiEnvelope<null>>(`/services/${id}`);
}
