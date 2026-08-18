import { apiClient } from "@/lib/api-client";
import type { PaginatedResult } from "@/lib/pagination";
import type { Chat, ChatMessage, ChatSummary } from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function fetchMyChats(params: { page?: number }) {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<ChatSummary>>>("/chats", {
    params,
  });
  return data.data;
}

export async function fetchChat(id: string) {
  const { data } = await apiClient.get<ApiEnvelope<Chat>>(`/chats/${id}`);
  return data.data;
}

export async function fetchChatMessages(id: string, params: { page?: number }) {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<ChatMessage>>>(
    `/chats/${id}/messages`,
    { params },
  );
  return data.data;
}

export async function startChat(input: { counterpartId: string; projectRequestId?: string }) {
  const { data } = await apiClient.post<ApiEnvelope<Chat>>("/chats", input);
  return data.data;
}

export async function markChatRead(id: string) {
  await apiClient.post<ApiEnvelope<null>>(`/chats/${id}/read`);
}
