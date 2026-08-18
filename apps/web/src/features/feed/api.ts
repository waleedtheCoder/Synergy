import { apiClient } from "@/lib/api-client";
import type { PaginatedResult } from "@/lib/pagination";
import type { FeedComment, FeedProject } from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function fetchFeed(params: { page?: number; categoryId?: string }) {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<FeedProject>>>("/feed", {
    params,
  });
  return data.data;
}

export async function fetchFeedProject(id: string) {
  const { data } = await apiClient.get<ApiEnvelope<FeedProject>>(`/feed/${id}`);
  return data.data;
}

export async function likeProject(id: string) {
  await apiClient.post<ApiEnvelope<null>>(`/feed/${id}/like`);
}

export async function unlikeProject(id: string) {
  await apiClient.delete<ApiEnvelope<null>>(`/feed/${id}/like`);
}

export async function bookmarkProject(id: string) {
  await apiClient.post<ApiEnvelope<null>>(`/feed/${id}/bookmark`);
}

export async function unbookmarkProject(id: string) {
  await apiClient.delete<ApiEnvelope<null>>(`/feed/${id}/bookmark`);
}

export async function fetchFeedComments(id: string, params: { page?: number }) {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<FeedComment>>>(
    `/feed/${id}/comments`,
    { params },
  );
  return data.data;
}

export async function addFeedComment(id: string, content: string) {
  const { data } = await apiClient.post<ApiEnvelope<FeedComment>>(`/feed/${id}/comments`, {
    content,
  });
  return data.data;
}

export async function fetchBookmarkedProjects(params: { page?: number }) {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<FeedProject>>>(
    "/feed/bookmarks/me",
    { params },
  );
  return data.data;
}
