import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { fetchChat, fetchChatMessages, fetchMyChats, markChatRead, startChat } from "./api";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? fallback;
  }
  return fallback;
}

export function useMyChats(params: { page?: number }) {
  return useQuery({
    queryKey: ["chats", "me", params],
    queryFn: () => fetchMyChats(params),
  });
}

export function useChat(id: string) {
  return useQuery({
    queryKey: ["chats", id],
    queryFn: () => fetchChat(id),
    enabled: Boolean(id),
  });
}

export function useChatMessages(id: string, params: { page?: number }) {
  return useQuery({
    queryKey: ["chats", id, "messages", params],
    queryFn: () => fetchChatMessages(id, params),
    enabled: Boolean(id),
  });
}

export function useStartChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startChat,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Could not start the chat"));
    },
  });
}

export function useMarkChatRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markChatRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
}
