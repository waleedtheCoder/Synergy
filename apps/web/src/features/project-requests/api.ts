import { apiClient } from "@/lib/api-client";
import type { PaginatedResult } from "@/lib/pagination";
import type { ProjectRequest, ProjectRequestStatus } from "./types";
import type { CreateProjectRequestPayload } from "./schemas";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function createProjectRequest(input: CreateProjectRequestPayload) {
  const { data } = await apiClient.post<ApiEnvelope<ProjectRequest>>(
    "/project-requests",
    input,
  );
  return data.data;
}

export async function fetchMyProjectRequests(params: {
  page?: number;
  status?: ProjectRequestStatus;
}) {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<ProjectRequest>>>(
    "/project-requests/me",
    { params },
  );
  return data.data;
}

export async function fetchProjectRequest(id: string) {
  const { data } = await apiClient.get<ApiEnvelope<ProjectRequest>>(
    `/project-requests/${id}`,
  );
  return data.data;
}

export async function updateProjectRequest(id: string, input: Partial<CreateProjectRequestPayload>) {
  const { data } = await apiClient.patch<ApiEnvelope<ProjectRequest>>(
    `/project-requests/${id}`,
    input,
  );
  return data.data;
}

export async function cancelProjectRequest(id: string) {
  const { data } = await apiClient.post<ApiEnvelope<ProjectRequest>>(
    `/project-requests/${id}/cancel`,
  );
  return data.data;
}
