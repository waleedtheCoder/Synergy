import { apiClient } from "@/lib/api-client";
import type { MessageMeeting, MeetingStatus } from "@/features/chats/types";
import type { MeetingPayload } from "./schemas";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function createMeeting(input: MeetingPayload) {
  const { data } = await apiClient.post<ApiEnvelope<MessageMeeting>>("/meetings", input);
  return data.data;
}

export async function updateMeetingStatus(id: string, status: MeetingStatus) {
  const { data } = await apiClient.patch<ApiEnvelope<MessageMeeting>>(`/meetings/${id}/status`, {
    status,
  });
  return data.data;
}
