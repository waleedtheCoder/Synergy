"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateCampaignPayment } from "../hooks";
import { PaymentInstructionsPanel } from "./payment-instructions-panel";
import type { PaymentMethod } from "../types";

export function FundCampaignDialog({
  campaignId,
  budget,
  children,
}: {
  campaignId: string;
  budget: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("BANK_TRANSFER");
  const [reference, setReference] = useState("");

  const createPayment = useCreateCampaignPayment();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    createPayment.mutate(
      { campaignId, input: { method, reference: reference || undefined } },
      {
        onSuccess: () => {
          setOpen(false);
          setReference("");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fund campaign — ${Number(budget).toFixed(2)}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label>Payment method</Label>
            <Select value={method} onValueChange={(value) => setMethod(value as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BANK_TRANSFER">Bank transfer</SelectItem>
                <SelectItem value="IN_PERSON">Pay in person</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <PaymentInstructionsPanel method={method} />

          <div className="grid gap-2">
            <Label htmlFor="campaign-payment-reference">Reference / note (optional)</Label>
            <Input
              id="campaign-payment-reference"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="Transfer confirmation number, or a note for our team"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Your campaign can go live once our team confirms this payment and approves it.
          </p>

          <Button type="submit" className="mt-1 w-fit" disabled={createPayment.isPending}>
            {createPayment.isPending && <Loader2 className="size-4 animate-spin" />}
            Submit payment claim
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
