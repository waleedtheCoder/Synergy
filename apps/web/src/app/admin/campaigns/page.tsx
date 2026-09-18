"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Megaphone } from "lucide-react";
import type { CampaignStatus } from "@synergi/shared-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { useAdminCampaigns, useUpdateAdminCampaignStatus } from "@/features/admin/hooks";
import { CampaignStatusBadge } from "@/features/advertising/components/campaign-status-badge";

const STATUS_FILTERS: { label: string; value: CampaignStatus | undefined }[] = [
  { label: "Pending review", value: "PENDING_REVIEW" },
  { label: "Active", value: "ACTIVE" },
  { label: "Paused", value: "PAUSED" },
  { label: "All", value: undefined },
];

export default function AdminCampaignsPage() {
  const [status, setStatus] = useState<CampaignStatus | undefined>("PENDING_REVIEW");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminCampaigns({ page, status });
  const updateStatus = useUpdateAdminCampaignStatus();

  return (
    <div>
      <PageHeader title="Campaigns" description="Review and moderate advertiser campaigns." />

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
        <EmptyState icon={Megaphone} title="No campaigns here" description="Try a different filter." />
      )}

      <div className="grid gap-3">
        {data?.items.map((campaign) => (
          <Card key={campaign.id} className="p-4">
            <CardContent className="flex flex-col gap-3 p-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{campaign.name}</p>
                    <CampaignStatusBadge status={campaign.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {campaign.advertiser.companyName} · {campaign.placement.replace(/_/g, " ")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    ${Number(campaign.spend).toFixed(2)} / ${Number(campaign.budget).toFixed(2)} spent
                    · {campaign.impressions} impressions · {campaign.clicks} clicks
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={campaign.bannerImageUrl} target="_blank" rel="noreferrer">
                      View banner
                    </a>
                  </Button>

                  {campaign.status === "PENDING_REVIEW" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateStatus.mutate({ id: campaign.id, status: "REJECTED" })
                        }
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateStatus.mutate({ id: campaign.id, status: "ACTIVE" })}
                      >
                        Approve
                      </Button>
                    </>
                  )}

                  {campaign.status === "ACTIVE" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatus.mutate({ id: campaign.id, status: "PAUSED" })}
                      >
                        Pause
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateStatus.mutate({ id: campaign.id, status: "COMPLETED" })
                        }
                      >
                        Complete
                      </Button>
                    </>
                  )}

                  {campaign.status === "PAUSED" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateStatus.mutate({ id: campaign.id, status: "ACTIVE" })}
                      >
                        Reactivate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateStatus.mutate({ id: campaign.id, status: "COMPLETED" })
                        }
                      >
                        Complete
                      </Button>
                    </>
                  )}
                </div>
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
