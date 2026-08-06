import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store/auth-store";
import {
  fetchFavorites,
  fetchNotifications,
  fetchProfile,
  markAllNotificationsRead,
  markNotificationRead,
  removeFavorite,
  updateProfile,
} from "./api";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? fallback;
  }
  return fallback;
}

export function useNotifications(params: { page?: number; unreadOnly?: boolean }) {
  return useQuery({
    queryKey: ["notifications", "me", params],
    queryFn: () => fetchNotifications(params),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useFavorites(params: { page?: number }) {
  return useQuery({
    queryKey: ["favorites", "me", params],
    queryFn: () => fetchFavorites(params),
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => {
      toast.success("Removed from favorites");
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Could not remove favorite"));
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["users", "me"],
    queryFn: fetchProfile,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);
  const accessToken = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (profile) => {
      toast.success("Profile updated");
      void queryClient.invalidateQueries({ queryKey: ["users", "me"] });
      const currentUser = useAuthStore.getState().user;
      if (currentUser && accessToken) {
        setSession({
          accessToken,
          user: { ...currentUser, firstName: profile.firstName, lastName: profile.lastName },
        });
      }
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Could not update profile"));
    },
  });
}
