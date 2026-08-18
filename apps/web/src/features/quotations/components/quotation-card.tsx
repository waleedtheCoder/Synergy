"use client";

import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { MessageQuotation, QuotationStatus } from "@/features/chats/types";
import { useUpdateQuotationStatus } from "../hooks";

const STATUS_CONFIG: Record<
  QuotationStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  DRAFT: { label: "Draft", variant: "outline" },
  SENT: { label: "Awaiting response", variant: "secondary" },
  ACCEPTED: { label: "Accepted", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  COUNTERED: { label: "Countered", variant: "outline" },
  EXPIRED: { label: "Expired", variant: "outline" },
};

export function QuotationCard({
  quotation,
  canRespond,
}: {
  quotation: MessageQuotation;
  canRespond: boolean;
}) {
  const updateStatus = useUpdateQuotationStatus();
  const config = STATUS_CONFIG[quotation.status];

  return (
    <Card className="w-full max-w-sm p-4">
      <CardContent className="grid gap-3 p-0">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-foreground">Quotation</p>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>

        <div className="grid gap-1">
          {quotation.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm text-muted-foreground">
              <span>
                {item.description} × {Number(item.quantity)}
              </span>
              <span>${Number(item.total).toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border/60 pt-2">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="font-semibold text-foreground">
            ${Number(quotation.totalAmount).toLocaleString()}
          </span>
        </div>

        {quotation.notes && <p className="text-sm text-muted-foreground">{quotation.notes}</p>}
        {quotation.validUntil && (
          <p className="text-xs text-muted-foreground">
            Valid until {new Date(quotation.validUntil).toLocaleDateString()}
          </p>
        )}

        {canRespond && quotation.status === "SENT" && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1"
              disabled={updateStatus.isPending}
              onClick={() => updateStatus.mutate({ id: quotation.id, status: "ACCEPTED" })}
            >
              {updateStatus.isPending && <Loader2 className="size-4 animate-spin" />}
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              disabled={updateStatus.isPending}
              onClick={() => updateStatus.mutate({ id: quotation.id, status: "REJECTED" })}
            >
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
