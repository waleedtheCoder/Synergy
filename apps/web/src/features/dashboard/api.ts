import { apiClient } from "@/lib/api-client";
import type { PaginatedResult } from "@/lib/pagination";
import type { FavoriteProfessional, NotificationItem, Profile } from "./types";
import type { UpdateProfileInput } from "./schemas";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function fetchNotifications(params: { page?: number; unreadOnly?: boolean }) {
  const { data } = await apiClient.get<
    ApiEnvelope<PaginatedResult<NotificationItem> & { unreadCount: number }>
  >("/notifications/me", { params });
  return data.data;
}

export async function markNotificationRead(id: string) {
  await apiClient.patch<ApiEnvelope<NotificationItem>>(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await apiClient.post<ApiEnvelope<null>>("/notifications/read-all");
}

export async function fetchFavorites(params: { page?: number }) {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<FavoriteProfessional>>>(
    "/favorites/me",
    { params },
  );
  return data.data;
}

export async function addFavorite(professionalId: string) {
  await apiClient.post<ApiEnvelope<null>>(`/favorites/${professionalId}`);
}

export async function removeFavorite(professionalId: string) {
  await apiClient.delete<ApiEnvelope<null>>(`/favorites/${professionalId}`);
}

export async function fetchProfile() {
  const { data } = await apiClient.get<ApiEnvelope<Profile>>("/users/me");
  return data.data;
}

export async function updateProfile(input: UpdateProfileInput) {
  const { data } = await apiClient.patch<ApiEnvelope<Profile>>("/users/me", input);
  return data.data;
}
