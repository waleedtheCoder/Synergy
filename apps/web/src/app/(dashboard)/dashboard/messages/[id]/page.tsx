"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useChat, useChatMessages, useMarkChatRead } from "@/features/chats/hooks";
import { useChatRoom } from "@/features/chats/use-chat-room";
import { participantName } from "@/features/chats/participant-name";
import { MessageBubble } from "@/features/chats/components/message-bubble";
import { QuotationFormDialog } from "@/features/quotations/components/quotation-form-dialog";
import { MeetingFormDialog } from "@/features/meetings/components/meeting-form-dialog";

export default function ChatThreadPage() {
  const params = useParams<{ id: string }>();
  const chatId = params.id;
  const user = useAuthStore((state) => state.user);
  const { data: chat, isLoading: chatLoading } = useChat(chatId);
  const { data: messages, isLoading: messagesLoading } = useChatMessages(chatId, { page: 1 });
  const markRead = useMarkChatRead();
  const { sendMessage } = useChatRoom(chatId);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const isClient = user?.role === "CLIENT";
  const counterpart = chat ? (isClient ? chat.professional : chat.client) : null;
  const counterpartName = counterpart ? participantName(counterpart) : "";

  useEffect(() => {
    if (chatId) markRead.mutate(chatId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.items.length]);

  function handleSend() {
    const content = draft.trim();
    if (!content) return;
    sendMessage(content);
    setDraft("");
  }

  if (chatLoading || !chat) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="flex items-center gap-3 border-b border-border/60 pb-4">
        <Avatar>
          <AvatarFallback className="bg-accent font-medium text-primary">
            {counterpart?.user.firstName.charAt(0)}
            {counterpart?.user.lastName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <p className="font-semibold text-foreground">{counterpartName}</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto py-4">
        {messagesLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {messages?.items.map((message) => (
          <MessageBubble key={message.id} message={message} isClient={Boolean(isClient)} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-end gap-2 border-t border-border/60 pt-4">
        {!isClient && (
          <QuotationFormDialog
            chatId={chatId}
            projectRequestId={chat.projectRequestId ?? undefined}
            trigger={
              <Button variant="outline" size="sm" type="button">
                Quote
              </Button>
            }
          />
        )}
        <MeetingFormDialog
          chatId={chatId}
          trigger={
            <Button variant="outline" size="sm" type="button">
              Meet
            </Button>
          }
        />
        <Textarea
          rows={1}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message…"
          className="min-h-0 flex-1 resize-none"
        />
        <Button size="icon" onClick={handleSend} disabled={!draft.trim()}>
          <Send />
        </Button>
      </div>
    </div>
  );
}
