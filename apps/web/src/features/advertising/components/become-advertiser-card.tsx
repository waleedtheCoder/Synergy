"use client";

import { useState } from "react";
import { Loader2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateAdvertiser } from "../hooks";

export function BecomeAdvertiserCard() {
  const [companyName, setCompanyName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const createAdvertiser = useCreateAdvertiser();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    createAdvertiser.mutate({ companyName, billingEmail: billingEmail || undefined });
  }

  return (
    <Card className="mx-auto max-w-md p-6">
      <CardContent className="flex flex-col gap-4 p-0">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-primary">
            <Megaphone className="size-6" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Advertise on Synergi</h2>
          <p className="text-sm text-muted-foreground">
            Reach clients and professionals with banner campaigns across the platform.
          </p>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="advertiser-company">Company name</Label>
            <Input
              id="advertiser-company"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="advertiser-billing">Billing email (optional)</Label>
            <Input
              id="advertiser-billing"
              type="email"
              value={billingEmail}
              onChange={(event) => setBillingEmail(event.target.value)}
            />
          </div>
          <Button type="submit" disabled={createAdvertiser.isPending || !companyName}>
            {createAdvertiser.isPending && <Loader2 className="size-4 animate-spin" />}
            Become an advertiser
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
