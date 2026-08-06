import { Badge } from "@/components/ui/badge";
import type { ProjectRequestStatus } from "../types";

const STATUS_CONFIG: Record<
  ProjectRequestStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  OPEN: { label: "Open", variant: "outline" },
  IN_PROGRESS: { label: "In progress", variant: "default" },
  COMPLETED: { label: "Completed", variant: "secondary" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export function ProjectRequestStatusBadge({ status }: { status: ProjectRequestStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
