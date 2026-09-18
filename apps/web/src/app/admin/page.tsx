"use client";

import {
  AlertTriangle,
  BadgeCheck,
  Briefcase,
  CreditCard,
  Flag,
  ListChecks,
  Megaphone,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { useAdminStats } from "@/features/admin/hooks";
import { StatCard } from "@/features/admin/components/stat-card";

export default function AdminOverviewPage() {
  const { data, isLoading } = useAdminStats();

  return (
    <div>
      <PageHeader title="Overview" description="Platform-wide activity and moderation queue." />

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      )}

      {data && (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Users</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Users} label="Total users" value={data.users.total} />
              <StatCard icon={Users} label="Clients" value={data.users.clients} />
              <StatCard icon={Briefcase} label="Professionals" value={data.users.professionals} />
              <StatCard icon={Users} label="Pending" value={data.users.pending} />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
              Project requests
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={ListChecks}
                label="Total requests"
                value={data.projectRequests.total}
              />
              <StatCard icon={ListChecks} label="Open" value={data.projectRequests.open} />
              <StatCard icon={Wallet} label="Revenue" value={`$${data.revenue.total.toLocaleString()}`} />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
              Moderation queue
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={ShieldCheck}
                label="Unverified professionals"
                value={data.moderation.unverifiedProfessionals}
              />
              <StatCard
                icon={BadgeCheck}
                label="Pending certificates"
                value={data.moderation.pendingCertificates}
              />
              <StatCard icon={Flag} label="Pending reports" value={data.moderation.pendingReports} />
              <StatCard
                icon={AlertTriangle}
                label="Open disputes"
                value={data.moderation.openDisputes}
              />
              <StatCard
                icon={Megaphone}
                label="Pending campaigns"
                value={data.moderation.pendingCampaigns}
              />
              <StatCard
                icon={CreditCard}
                label="Pending payments"
                value={data.moderation.pendingPayments}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
