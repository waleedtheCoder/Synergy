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
import { PaymentInstructionsPanel } from "@/features/payments/components/payment-instructions-panel";
import { useCreateSubscriptionPayment } from "@/features/payments/hooks";
import type { PaymentMethod } from "@/features/payments/types";
import type { SubscriptionPlan } from "../types";

export function UpgradePlanDialog({
  plan,
  planName,
  priceMonthly,
  children,
}: {
  plan: SubscriptionPlan;
  planName: string;
  priceMonthly: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("BANK_TRANSFER");
  const [reference, setReference] = useState("");

  const createPayment = useCreateSubscriptionPayment();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    createPayment.mutate(
      { plan, method, reference: reference || undefined },
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
          <DialogTitle>
            Upgrade to {planName} — ${priceMonthly}/mo
          </DialogTitle>
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
            <Label htmlFor="payment-reference">Reference / note (optional)</Label>
            <Input
              id="payment-reference"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="Transfer confirmation number, or a note for our team"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Your plan will be upgraded once our team confirms the payment.
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
