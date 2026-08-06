"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, Loader2, MapPin, Wallet, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ROUTES } from "@/constants/routes";
import { useCancelProjectRequest, useProjectRequest } from "@/features/project-requests/hooks";
import { ProjectRequestStatusBadge } from "@/features/project-requests/components/status-badge";

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: request, isLoading } = useProjectRequest(params.id);
  const cancelRequest = useCancelProjectRequest();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading || !request) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const budget =
    request.budgetMin || request.budgetMax
      ? [
          request.budgetMin ? `$${Number(request.budgetMin).toLocaleString()}` : null,
          request.budgetMax ? `$${Number(request.budgetMax).toLocaleString()}` : null,
        ]
          .filter(Boolean)
          .join(" – ")
      : null;

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{request.title}</h1>
          <div className="mt-2">
            <ProjectRequestStatusBadge status={request.status} />
          </div>
        </div>
        {request.status === "OPEN" && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <XCircle />
                Cancel request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel this project request?</DialogTitle>
                <DialogDescription>
                  This cannot be undone. Professionals will no longer be able to send quotations for it.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Keep it
                </Button>
                <Button
                  variant="destructive"
                  disabled={cancelRequest.isPending}
                  onClick={() =>
                    cancelRequest.mutate(request.id, {
                      onSuccess: () => {
                        setDialogOpen(false);
                        router.push(ROUTES.dashboardRequests);
                      },
                    })
                  }
                >
                  {cancelRequest.isPending && <Loader2 className="size-4 animate-spin" />}
                  Cancel request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="p-5">
        <CardContent className="grid gap-4 p-0">
          <p className="whitespace-pre-wrap text-sm text-foreground">{request.description}</p>

          <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-border/60 pt-4 text-sm text-muted-foreground">
            {budget && (
              <span className="flex items-center gap-1.5">
                <Wallet className="size-4" />
                {budget}
              </span>
            )}
            {request.timeline && (
              <span className="flex items-center gap-1.5">
                <Calendar className="size-4" />
                {request.timeline}
              </span>
            )}
            {(request.city || request.address) && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" />
                {[request.address, request.city?.name].filter(Boolean).join(", ")}
              </span>
            )}
          </div>

          {request.category && (
            <p className="text-sm text-muted-foreground">
              Category: <span className="text-foreground">{request.category.name}</span>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
