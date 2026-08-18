import { apiClient } from "@/lib/api-client";
import type { PaginatedResult } from "@/lib/pagination";
import type { PortfolioProject } from "./types";
import type { PortfolioProjectPayload } from "./schemas";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function fetchMyPortfolioProjects(params: { page?: number }) {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<PortfolioProject>>>(
    "/portfolio-projects/me",
    { params },
  );
  return data.data;
}

export async function createPortfolioProject(input: PortfolioProjectPayload) {
  const { data } = await apiClient.post<ApiEnvelope<PortfolioProject>>(
    "/portfolio-projects",
    input,
  );
  return data.data;
}

export async function updatePortfolioProject(
  id: string,
  input: Partial<PortfolioProjectPayload>,
) {
  const { data } = await apiClient.patch<ApiEnvelope<PortfolioProject>>(
    `/portfolio-projects/${id}`,
    input,
  );
  return data.data;
}

export async function deletePortfolioProject(id: string) {
  await apiClient.delete<ApiEnvelope<null>>(`/portfolio-projects/${id}`);
}
