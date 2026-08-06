"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ListChecks, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { useMyProjectRequests } from "@/features/project-requests/hooks";
import { RequestCard } from "@/features/project-requests/components/request-card";
import type { ProjectRequestStatus } from "@/features/project-requests/types";

const STATUS_FILTERS: { label: string; value: ProjectRequestStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Open", value: "OPEN" },
  { label: "In progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default function MyRequestsPage() {
  const [status, setStatus] = useState<ProjectRequestStatus | undefined>(undefined);
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyProjectRequests({ page, status });

  return (
    <div>
      <PageHeader
        title="My project requests"
        description="Everything you've posted, in one place."
        action={
          <Button asChild>
            <Link href={ROUTES.dashboardRequestsNew}>
              <Plus />
              New request
            </Link>
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.label}
            onClick={() => {
              setStatus(filter.value);
              setPage(1);
            }}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              status === filter.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {!isLoading && data && data.items.length === 0 && (
        <EmptyState
          icon={ListChecks}
          title="No requests here"
          description="Try a different filter, or post a new project request."
        />
      )}

      <div className="grid gap-4">
        {data?.items.map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft />
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
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}
