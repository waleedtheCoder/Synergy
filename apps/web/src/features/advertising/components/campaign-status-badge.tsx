import { Badge } from "@/components/ui/badge";
import type { CampaignStatus } from "../types";

const STATUS_CONFIG: Record<
  CampaignStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  DRAFT: { label: "Draft", variant: "outline" },
  PENDING_REVIEW: { label: "Pending review", variant: "outline" },
  ACTIVE: { label: "Active", variant: "secondary" },
  PAUSED: { label: "Paused", variant: "outline" },
  COMPLETED: { label: "Completed", variant: "secondary" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
