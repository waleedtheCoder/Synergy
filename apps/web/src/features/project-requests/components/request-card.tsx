import Link from "next/link";
import { Calendar, MapPin, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import type { ProjectRequest } from "../types";
import { ProjectRequestStatusBadge } from "./status-badge";

function formatBudget(request: ProjectRequest) {
  if (!request.budgetMin && !request.budgetMax) return null;
  const min = request.budgetMin ? `$${Number(request.budgetMin).toLocaleString()}` : null;
  const max = request.budgetMax ? `$${Number(request.budgetMax).toLocaleString()}` : null;
  if (min && max) return `${min} – ${max}`;
  return min ?? max;
}

export function RequestCard({ request }: { request: ProjectRequest }) {
  const budget = formatBudget(request);

  return (
    <Link href={`${ROUTES.dashboardRequests}/${request.id}`}>
      <Card className="p-5 transition-shadow hover:shadow-md">
        <CardContent className="flex flex-col gap-3 p-0">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-foreground">{request.title}</h3>
            <ProjectRequestStatusBadge status={request.status} />
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">{request.description}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {budget && (
              <span className="flex items-center gap-1">
                <Wallet className="size-3.5" />
                {budget}
              </span>
            )}
            {request.timeline && (
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" />
                {request.timeline}
              </span>
            )}
            {request.city && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {request.city.name}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
