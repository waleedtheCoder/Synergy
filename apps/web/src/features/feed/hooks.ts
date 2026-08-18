import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  addFeedComment,
  bookmarkProject,
  fetchBookmarkedProjects,
  fetchFeed,
  fetchFeedComments,
  fetchFeedProject,
  likeProject,
  unbookmarkProject,
  unlikeProject,
} from "./api";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? fallback;
  }
  return fallback;
}

export function useFeed(params: { page?: number; categoryId?: string }) {
  return useQuery({
    queryKey: ["feed", "list", params],
    queryFn: () => fetchFeed(params),
  });
}

export function useFeedProject(id: string) {
  return useQuery({
    queryKey: ["feed", id],
    queryFn: () => fetchFeedProject(id),
    enabled: Boolean(id),
  });
}

export function useFeedComments(id: string, params: { page?: number }) {
  return useQuery({
    queryKey: ["feed", id, "comments", params],
    queryFn: () => fetchFeedComments(id, params),
    enabled: Boolean(id),
  });
}

export function useBookmarkedProjects(params: { page?: number }) {
  return useQuery({
    queryKey: ["feed", "bookmarks", "me", params],
    queryFn: () => fetchBookmarkedProjects(params),
  });
}

export function useLikeProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, liked }: { id: string; liked: boolean }) =>
      liked ? unlikeProject(id) : likeProject(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Could not update like"));
    },
  });
}

export function useBookmarkProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, bookmarked }: { id: string; bookmarked: boolean }) =>
      bookmarked ? unbookmarkProject(id) : bookmarkProject(id),
    onSuccess: (_, variables) => {
      toast.success(variables.bookmarked ? "Removed from saved" : "Saved");
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Could not update saved projects"));
    },
  });
}

export function useAddFeedComment(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => addFeedComment(id, content),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["feed", id, "comments"] });
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Could not post the comment"));
    },
  });
}
