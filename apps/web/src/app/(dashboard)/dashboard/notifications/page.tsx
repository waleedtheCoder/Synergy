"use client";

import { useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/features/dashboard/hooks";

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useNotifications({ page });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Stay on top of activity across your projects."
        action={
          data && data.unreadCount > 0 ? (
            <Button variant="outline" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
              <CheckCheck />
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && data && data.items.length === 0 && (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up. New activity will show up here."
        />
      )}

      <div className="grid gap-2">
        {data?.items.map((notification) => (
          <button
            key={notification.id}
            onClick={() => !notification.read && markRead.mutate(notification.id)}
            className={cn(
              "flex items-start gap-3 rounded-xl border border-border/60 p-4 text-left transition-colors",
              notification.read ? "bg-background" : "bg-accent/40 hover:bg-accent/60",
            )}
          >
            <div
              className={cn(
                "mt-1 size-2 shrink-0 rounded-full",
                notification.read ? "bg-transparent" : "bg-primary",
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{notification.title}</p>
              {notification.body && (
                <p className="mt-0.5 text-sm text-muted-foreground">{notification.body}</p>
              )}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatRelativeTime(notification.createdAt)}
            </span>
          </button>
        ))}
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.meta.page} of {data.meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
