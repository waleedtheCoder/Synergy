"use client";

import Link from "next/link";
import { Loader2, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { useMyChats } from "@/features/chats/hooks";
import { participantName } from "@/features/chats/participant-name";
import type { ChatSummary } from "@/features/chats/types";

function lastMessagePreview(chat: ChatSummary) {
  if (!chat.lastMessage) return "No messages yet";
  if (chat.lastMessage.content) return chat.lastMessage.content;
  if (chat.lastMessage.type === "QUOTATION") return "Sent a quotation";
  if (chat.lastMessage.type === "MEETING") return "Proposed a meeting";
  return "New message";
}

export default function MessagesPage() {
  const user = useAuthStore((state) => state.user);
  const isClient = user?.role === "CLIENT";
  const { data, isLoading } = useMyChats({ page: 1 });
  const basePath = isClient ? ROUTES.dashboardMessages : ROUTES.proDashboardMessages;

  return (
    <div>
      <PageHeader title="Messages" description="Conversations with your matches." />

      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && data && data.items.length === 0 && (
        <EmptyState
          icon={MessageSquare}
          title="No conversations yet"
          description={
            isClient
              ? "Start a conversation from your favorites to see it here."
              : "Conversations started by clients will show up here."
          }
        />
      )}

      <div className="grid gap-2">
        {data?.items.map((chat) => {
          const counterpart = isClient ? chat.professional : chat.client;
          const name = participantName(counterpart);

          return (
            <Link key={chat.id} href={`${basePath}/${chat.id}`}>
              <Card className="p-4 transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-3 p-0">
                  <Avatar>
                    <AvatarFallback className="bg-accent font-medium text-primary">
                      {counterpart.user.firstName.charAt(0)}
                      {counterpart.user.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium text-foreground">{name}</p>
                      {chat.unreadCount > 0 && (
                        <Badge className="h-5 min-w-5 justify-center px-1">{chat.unreadCount}</Badge>
                      )}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{lastMessagePreview(chat)}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
