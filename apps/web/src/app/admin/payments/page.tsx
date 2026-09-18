"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CreditCard } from "lucide-react";
import type { PaymentStatus } from "@synergi/shared-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { useAdminPayments, useConfirmAdminPayment, useRejectAdminPayment } from "@/features/admin/hooks";

const STATUS_FILTERS: { label: string; value: PaymentStatus | undefined }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Succeeded", value: "SUCCEEDED" },
  { label: "Failed", value: "FAILED" },
  { label: "All", value: undefined },
];

const STATUS_BADGE_VARIANT: Record<PaymentStatus, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  SUCCEEDED: "secondary",
  FAILED: "destructive",
  REFUNDED: "destructive",
};

export default function AdminPaymentsPage() {
  const [status, setStatus] = useState<PaymentStatus | undefined>("PENDING");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminPayments({ page, status });
  const confirm = useConfirmAdminPayment();
  const reject = useRejectAdminPayment();

  return (
    <div>
      <PageHeader title="Payments" description="Review manual payment claims from users." />

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
        <EmptyState icon={CreditCard} title="No payments here" description="Try a different filter." />
      )}

      <div className="grid gap-3">
        {data?.items.map((payment) => (
          <Card key={payment.id} className="p-4">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-0">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">
                    ${Number(payment.amount).toFixed(2)} {payment.currency} — {payment.type}
                  </p>
                  <Badge variant={STATUS_BADGE_VARIANT[payment.status]}>{payment.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {payment.user.firstName} {payment.user.lastName} ({payment.user.email}) ·{" "}
                  {payment.method.replace(/_/g, " ").toLowerCase()}
                  {payment.subscription && ` · upgrading to ${payment.targetPlan}`}
                  {payment.campaign && ` · funding "${payment.campaign.name}"`}
                </p>
                {payment.reference && (
                  <p className="mt-1 text-xs text-muted-foreground">Reference: {payment.reference}</p>
                )}
              </div>

              {payment.status === "PENDING" && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => reject.mutate(payment.id)}>
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => confirm.mutate(payment.id)}>
                    Confirm
                  </Button>
                </div>
              )}
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
