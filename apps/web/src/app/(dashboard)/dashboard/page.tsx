"use client";

import Link from "next/link";
import { Bell, Heart, ListChecks, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { useNotifications, useFavorites } from "@/features/dashboard/hooks";
import { useMyProjectRequests } from "@/features/project-requests/hooks";
import { RequestCard } from "@/features/project-requests/components/request-card";

export default function DashboardOverviewPage() {
  const user = useAuthStore((state) => state.user);
  const { data: requests } = useMyProjectRequests({ page: 1 });
  const { data: favorites } = useFavorites({ page: 1 });
  const { data: notifications } = useNotifications({ unreadOnly: true });

  return (
    <div>
      <PageHeader
        title={`Welcome back${user ? `, ${user.firstName}` : ""}`}
        description="Here's what's happening with your projects."
        action={
          <Button asChild>
            <Link href={ROUTES.dashboardRequestsNew}>
              <Plus />
              New project request
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={ListChecks} label="Open requests" value={requests?.meta.total ?? 0} />
        <StatCard icon={Heart} label="Favorites" value={favorites?.meta.total ?? 0} />
        <StatCard icon={Bell} label="Unread notifications" value={notifications?.unreadCount ?? 0} />
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent requests</h2>
          <Link href={ROUTES.dashboardRequests} className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>

        {requests && requests.items.length > 0 ? (
          <div className="grid gap-4">
            {requests.items.slice(0, 3).map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ListChecks}
            title="No project requests yet"
            description="Post your first project request to start receiving quotations from professionals."
            action={
              <Button asChild className="mt-2">
                <Link href={ROUTES.dashboardRequestsNew}>Post a project request</Link>
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
