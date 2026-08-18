"use client";

import Link from "next/link";
import { Bell, Briefcase, Images, Star } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { useNotifications } from "@/features/dashboard/hooks";
import { useProfessionalProfile } from "@/features/professional-profile/hooks";
import { useMyPortfolioProjects } from "@/features/portfolio/hooks";
import { PortfolioCard } from "@/features/portfolio/components/portfolio-card";
import { Button } from "@/components/ui/button";

export default function ProDashboardOverviewPage() {
  const user = useAuthStore((state) => state.user);
  const { data: profile } = useProfessionalProfile();
  const { data: portfolio } = useMyPortfolioProjects({ page: 1 });
  const { data: notifications } = useNotifications({ unreadOnly: true });

  return (
    <div>
      <PageHeader
        title={`Welcome back${user ? `, ${user.firstName}` : ""}`}
        description="Here's how your professional profile is performing."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Star}
          label="Rating"
          value={profile ? `${Number(profile.ratingAvg).toFixed(1)} (${profile.ratingCount})` : "–"}
        />
        <StatCard icon={Briefcase} label="Active services" value={profile?.servicesCount ?? 0} />
        <StatCard icon={Images} label="Portfolio projects" value={profile?.portfolioCount ?? 0} />
        <StatCard icon={Bell} label="Unread notifications" value={notifications?.unreadCount ?? 0} />
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent portfolio projects</h2>
          <Link href={ROUTES.proDashboardPortfolio} className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>

        {portfolio && portfolio.items.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {portfolio.items.slice(0, 3).map((project) => (
              <PortfolioCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Images}
            title="No portfolio projects yet"
            description="Showcase your completed work by adding your first portfolio project."
            action={
              <Button asChild className="mt-2">
                <Link href={ROUTES.proDashboardPortfolio}>Add a portfolio project</Link>
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
