"use client";

import { useAuthStore } from "@/features/auth/store/auth-store";
import { MeetingCard } from "@/features/meetings/components/meeting-card";
import { QuotationCard } from "@/features/quotations/components/quotation-card";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "../types";

export function MessageBubble({ message, isClient }: { message: ChatMessage; isClient: boolean }) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isOwn = message.senderId === currentUserId;

  if (message.type === "QUOTATION" && message.quotation) {
    return (
      <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
        <QuotationCard quotation={message.quotation} canRespond={isClient && !isOwn} />
      </div>
    );
  }

  if (message.type === "MEETING" && message.meeting) {
    return (
      <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
        <MeetingCard meeting={message.meeting} />
      </div>
    );
  }

  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
          isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p
          className={cn(
            "mt-1 text-[11px]",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {new Date(message.createdAt).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
