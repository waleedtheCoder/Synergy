"use client";

import { Eye, MousePointerClick, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FundCampaignDialog } from "@/features/payments/components/fund-campaign-dialog";
import {
  useDeleteCampaign,
  usePauseCampaign,
  useResumeCampaign,
  useStopCampaign,
  useSubmitCampaign,
} from "../hooks";
import { CampaignStatusBadge } from "./campaign-status-badge";
import type { Campaign } from "../types";

const OPEN_CAMPAIGN_STATUSES = ["DRAFT", "PENDING_REVIEW", "REJECTED"];

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const submit = useSubmitCampaign();
  const pause = usePauseCampaign();
  const resume = useResumeCampaign();
  const stop = useStopCampaign();
  const remove = useDeleteCampaign();

  const hasOpenPayment = campaign.payments.some(
    (p) => p.status === "PENDING" || p.status === "SUCCEEDED",
  );
  const isPaymentConfirmed = campaign.payments.some((p) => p.status === "SUCCEEDED");
  const needsFunding = OPEN_CAMPAIGN_STATUSES.includes(campaign.status) && !hasOpenPayment;
  const fundingPending =
    OPEN_CAMPAIGN_STATUSES.includes(campaign.status) && hasOpenPayment && !isPaymentConfirmed;

  return (
    <Card className="p-5">
      <CardContent className="flex flex-col gap-3 p-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-foreground">{campaign.name}</h3>
            <p className="text-sm text-muted-foreground">
              {campaign.placement.replace(/_/g, " ").toLowerCase()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CampaignStatusBadge status={campaign.status} />
            {isPaymentConfirmed && OPEN_CAMPAIGN_STATUSES.includes(campaign.status) && (
              <Badge variant="secondary">Funded</Badge>
            )}
            {fundingPending && <Badge variant="outline">Payment pending</Badge>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="size-3.5" />
            {campaign.impressions} impressions
          </span>
          <span className="flex items-center gap-1">
            <MousePointerClick className="size-3.5" />
            {campaign.clicks} clicks
          </span>
          <span className="flex items-center gap-1">
            <Wallet className="size-3.5" />${Number(campaign.spend).toFixed(2)} / $
            {Number(campaign.budget).toFixed(2)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {needsFunding && (
            <FundCampaignDialog campaignId={campaign.id} budget={campaign.budget}>
              <Button size="sm" variant="outline">
                Fund campaign
              </Button>
            </FundCampaignDialog>
          )}
          {(campaign.status === "DRAFT" || campaign.status === "REJECTED") && (
            <>
              <Button size="sm" onClick={() => submit.mutate(campaign.id)}>
                Submit for review
              </Button>
              {campaign.status === "DRAFT" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => remove.mutate(campaign.id)}
                >
                  Delete
                </Button>
              )}
            </>
          )}
          {campaign.status === "ACTIVE" && (
            <>
              <Button size="sm" variant="outline" onClick={() => pause.mutate(campaign.id)}>
                Pause
              </Button>
              <Button size="sm" variant="outline" onClick={() => stop.mutate(campaign.id)}>
                Stop
              </Button>
            </>
          )}
          {campaign.status === "PAUSED" && (
            <>
              <Button size="sm" onClick={() => resume.mutate(campaign.id)}>
                Resume
              </Button>
              <Button size="sm" variant="outline" onClick={() => stop.mutate(campaign.id)}>
                Stop
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
