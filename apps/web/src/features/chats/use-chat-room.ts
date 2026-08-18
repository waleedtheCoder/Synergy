"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getChatSocket } from "@/lib/socket";
import type { PaginatedResult } from "@/lib/pagination";
import type { ChatMessage, MessageMeeting, MessageQuotation } from "./types";

export function useChatRoom(chatId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!chatId) return;
    const socket = getChatSocket();
    socket.emit("chat:join", { chatId });

    function upsertMessage(message: ChatMessage) {
      if (message.chatId !== chatId) return;
      queryClient.setQueriesData<PaginatedResult<ChatMessage> | undefined>(
        { queryKey: ["chats", chatId, "messages"] },
        (old) => {
          if (!old) return old;
          const exists = old.items.some((item) => item.id === message.id);
          const items = exists
            ? old.items.map((item) => (item.id === message.id ? message : item))
            : [...old.items, message];
          return { ...old, items };
        },
      );
      void queryClient.invalidateQueries({ queryKey: ["chats", "me"] });
    }

    function onQuotationUpdated(quotation: MessageQuotation) {
      queryClient.setQueriesData<PaginatedResult<ChatMessage> | undefined>(
        { queryKey: ["chats", chatId, "messages"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) =>
              item.quotation?.id === quotation.id ? { ...item, quotation } : item,
            ),
          };
        },
      );
    }

    function onMeetingUpdated(meeting: MessageMeeting) {
      queryClient.setQueriesData<PaginatedResult<ChatMessage> | undefined>(
        { queryKey: ["chats", chatId, "messages"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) =>
              item.meeting?.id === meeting.id ? { ...item, meeting } : item,
            ),
          };
        },
      );
    }

    socket.on("message:new", upsertMessage);
    socket.on("quotation:updated", onQuotationUpdated);
    socket.on("meeting:updated", onMeetingUpdated);

    return () => {
      socket.emit("chat:leave", { chatId });
      socket.off("message:new", upsertMessage);
      socket.off("quotation:updated", onQuotationUpdated);
      socket.off("meeting:updated", onMeetingUpdated);
    };
  }, [chatId, queryClient]);

  function sendMessage(content: string) {
    getChatSocket().emit("message:send", { chatId, content });
  }

  return { sendMessage };
}
