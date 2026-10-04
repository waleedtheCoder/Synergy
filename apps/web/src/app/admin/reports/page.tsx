"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import type { ReportStatus } from "@synergi/shared-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { useAdminReports, useResolveAdminReport } from "@/features/admin/hooks";
import { ReportStatusBadge } from "@/features/admin/components/status-badges";
import { ReportAssessmentPanel } from "@/features/ai/components/moderation-assessment";

const STATUS_FILTERS: { label: string; value: ReportStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Pending", value: "PENDING" },
  { label: "Actioned", value: "ACTIONED" },
  { label: "Dismissed", value: "DISMISSED" },
];

export default function AdminReportsPage() {
  const [status, setStatus] = useState<ReportStatus | undefined>("PENDING");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminReports({ page, status });
  const resolveReport = useResolveAdminReport();

  return (
    <div>
      <PageHeader title="Reports" description="User-filed reports awaiting review." />

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
        <EmptyState icon={Flag} title="No reports here" description="Try a different filter." />
      )}

      <div className="grid gap-3">
        {data?.items.map((report) => (
          <Card key={report.id} className="p-4">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-0">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{report.targetType}</p>
                  <ReportStatusBadge status={report.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{report.reason}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Filed by {report.reporter.firstName} {report.reporter.lastName} (
                  {report.reporter.email})
                </p>
              </div>
              {report.status === "PENDING" && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resolveReport.mutate({ id: report.id, status: "DISMISSED" })}
                  >
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => resolveReport.mutate({ id: report.id, status: "ACTIONED" })}
                  >
                    Action
                  </Button>
                </div>
              )}
            </CardContent>
            {report.status === "PENDING" && (
              <div className="mt-3">
                <ReportAssessmentPanel reportId={report.id} />
              </div>
            )}
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
