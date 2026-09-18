import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { UpgradePlanDialog } from "./upgrade-plan-dialog";
import type { PlanDefinition, SubscriptionPlan } from "../types";

export function PlanCard({
  definition,
  currentPlan,
  hasPendingPayment,
}: {
  definition: PlanDefinition;
  currentPlan: SubscriptionPlan;
  hasPendingPayment: boolean;
}) {
  const isCurrent = definition.plan === currentPlan;

  return (
    <Card className={cn("flex flex-col p-5", isCurrent && "border-primary")}>
      <CardContent className="flex flex-1 flex-col gap-4 p-0">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{definition.name}</h3>
            {isCurrent && <Badge variant="secondary">Current plan</Badge>}
          </div>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            ${definition.priceMonthly}
            <span className="text-sm font-normal text-muted-foreground">/mo</span>
          </p>
        </div>

        <ul className="flex-1 space-y-2 text-sm text-muted-foreground">
          {definition.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              {feature}
            </li>
          ))}
        </ul>

        {isCurrent ? (
          <Button variant="outline" disabled>
            Current plan
          </Button>
        ) : definition.plan === "BASIC" ? null : (
          <UpgradePlanDialog
            plan={definition.plan}
            planName={definition.name}
            priceMonthly={definition.priceMonthly}
          >
            <Button disabled={hasPendingPayment}>
              {hasPendingPayment ? "Upgrade pending" : "Upgrade"}
            </Button>
          </UpgradePlanDialog>
        )}
      </CardContent>
    </Card>
  );
}
