"use client";

import { useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import type { DisputeStatus } from "@synergi/shared-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { useAdminDisputes } from "@/features/admin/hooks";
import { DisputeStatusBadge } from "@/features/admin/components/status-badges";
import { ResolveDisputeDialog } from "@/features/admin/components/resolve-dispute-dialog";

const STATUS_FILTERS: { label: string; value: DisputeStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Open", value: "OPEN" },
  { label: "Under review", value: "UNDER_REVIEW" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Rejected", value: "REJECTED" },
];

export default function AdminDisputesPage() {
  const [status, setStatus] = useState<DisputeStatus | undefined>("OPEN");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminDisputes({ page, status });

  const isFinal = (s: DisputeStatus) => s === "RESOLVED" || s === "REJECTED";

  return (
    <div>
      <PageHeader title="Disputes" description="Disputes raised between clients and professionals." />

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
        <EmptyState icon={AlertTriangle} title="No disputes here" description="Try a different filter." />
      )}

      <div className="grid gap-3">
        {data?.items.map((dispute) => (
          <Card key={dispute.id} className="p-4">
            <CardContent className="flex flex-col gap-3 p-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{dispute.reason}</p>
                    <DisputeStatusBadge status={dispute.status} />
                  </div>
                  {dispute.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{dispute.description}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {dispute.raisedBy.firstName} {dispute.raisedBy.lastName} vs{" "}
                    {dispute.against.firstName} {dispute.against.lastName}
                  </p>
                  {dispute.resolution && (
                    <p className="mt-2 rounded-lg bg-muted p-2 text-xs text-foreground">
                      Resolution: {dispute.resolution}
                    </p>
                  )}
                </div>

                {!isFinal(dispute.status) && (
                  <div className="flex items-center gap-2">
                    {dispute.status === "OPEN" && (
                      <ResolveDisputeDialog
                        disputeId={dispute.id}
                        status="UNDER_REVIEW"
                        triggerLabel="Start review"
                      />
                    )}
                    <ResolveDisputeDialog
                      disputeId={dispute.id}
                      status="REJECTED"
                      triggerLabel="Reject"
                    />
                    <ResolveDisputeDialog
                      disputeId={dispute.id}
                      status="RESOLVED"
                      triggerLabel="Resolve"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
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
