import { Badge } from "@/components/ui/badge";
import type { UserStatus, ReportStatus, DisputeStatus } from "@synergi/shared-types";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const USER_STATUS_CONFIG: Record<UserStatus, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: "Pending", variant: "outline" },
  ACTIVE: { label: "Active", variant: "secondary" },
  SUSPENDED: { label: "Suspended", variant: "destructive" },
  DEACTIVATED: { label: "Deactivated", variant: "destructive" },
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const config = USER_STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

const REPORT_STATUS_CONFIG: Record<ReportStatus, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: "Pending", variant: "outline" },
  ACTIONED: { label: "Actioned", variant: "secondary" },
  DISMISSED: { label: "Dismissed", variant: "destructive" },
};

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const config = REPORT_STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

const DISPUTE_STATUS_CONFIG: Record<DisputeStatus, { label: string; variant: BadgeVariant }> = {
  OPEN: { label: "Open", variant: "outline" },
  UNDER_REVIEW: { label: "Under review", variant: "default" },
  RESOLVED: { label: "Resolved", variant: "secondary" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

export function DisputeStatusBadge({ status }: { status: DisputeStatus }) {
  const config = DISPUTE_STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
