"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { DisputeStatus } from "@synergi/shared-types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useResolveAdminDispute } from "@/features/admin/hooks";

export function ResolveDisputeDialog({
  disputeId,
  status,
  triggerLabel,
}: {
  disputeId: string;
  status: DisputeStatus;
  triggerLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [resolution, setResolution] = useState("");
  const resolveDispute = useResolveAdminDispute();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    resolveDispute.mutate(
      { id: disputeId, input: { status, resolution: resolution || undefined } },
      {
        onSuccess: () => {
          setOpen(false);
          setResolution("");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={status === "REJECTED" ? "outline" : "default"}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{triggerLabel}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <Textarea
            value={resolution}
            onChange={(event) => setResolution(event.target.value)}
            placeholder="Resolution notes (optional)"
            rows={4}
          />
          <Button type="submit" className="w-fit" disabled={resolveDispute.isPending}>
            {resolveDispute.isPending && <Loader2 className="size-4 animate-spin" />}
            Confirm
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
