"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { usePlans, useMySubscription, useDowngradeToBasic } from "@/features/subscriptions/hooks";
import { PlanCard } from "@/features/subscriptions/components/plan-card";
import { useMyPayments } from "@/features/payments/hooks";

export default function BillingPage() {
  const { data: plans, isLoading: isLoadingPlans } = usePlans();
  const { data: subscription, isLoading: isLoadingSubscription } = useMySubscription();
  const { data: payments } = useMyPayments({ status: "PENDING" });
  const downgrade = useDowngradeToBasic();

  const pendingSubscriptionPayment = payments?.items.find((p) => p.type === "SUBSCRIPTION");

  if (isLoadingPlans || isLoadingSubscription) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Billing" description="Manage your subscription plan and payment history." />

      {pendingSubscriptionPayment && (
        <Card className="mb-6 border-primary/40 bg-accent/40 p-4">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-0">
            <div>
              <p className="font-medium text-foreground">
                Upgrade to {pendingSubscriptionPayment.targetPlan} pending confirmation
              </p>
              <p className="text-sm text-muted-foreground">
                We&apos;ll activate your new plan once the payment is confirmed.
              </p>
            </div>
            <Badge variant="outline">Pending</Badge>
          </CardContent>
        </Card>
      )}

      {subscription && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-4">
          <div>
            <p className="text-sm text-muted-foreground">Current plan</p>
            <p className="text-lg font-semibold text-foreground">{subscription.plan}</p>
            {subscription.currentPeriodEnd && (
              <p className="text-xs text-muted-foreground">
                Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>
          {subscription.plan !== "BASIC" && (
            <Button variant="outline" size="sm" onClick={() => downgrade.mutate()}>
              Downgrade to Basic
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plans?.map((definition) => (
          <PlanCard
            key={definition.plan}
            definition={definition}
            currentPlan={subscription?.plan ?? "BASIC"}
            hasPendingPayment={!!pendingSubscriptionPayment}
          />
        ))}
      </div>
    </div>
  );
}
