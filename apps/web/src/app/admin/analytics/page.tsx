"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Loader2, MessageSquare, MousePointerClick, Search, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { useAdminAnalytics } from "@/features/analytics/hooks";
import { StatTile } from "@/features/analytics/components/stat-tile";
import { EventChart } from "@/features/analytics/components/event-chart";

const RANGE_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useAdminAnalytics(days);

  return (
    <div>
      <PageHeader title="Analytics" description="Platform-wide engagement activity." />

      <div className="mb-5 flex flex-wrap gap-2">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setDays(option.value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              days === option.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile icon={Eye} label="Profile views" value={data.totals.PROFILE_VIEW} />
            <StatTile
              icon={Search}
              label="Search appearances"
              value={data.totals.SEARCH_APPEARANCE}
            />
            <StatTile
              icon={MousePointerClick}
              label="Profile clicks"
              value={data.totals.PROFILE_CLICK}
            />
            <StatTile icon={MessageSquare} label="Inquiries" value={data.totals.INQUIRY} />
          </div>

          <Card className="p-5">
            <CardContent className="p-0">
              {data.series.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No activity yet in this range.
                </p>
              ) : (
                <EventChart series={data.series} />
              )}
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
              Top viewed professionals
            </h2>
            {data.topProfessionals.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title="No views yet"
                description="Top professionals will show up here once profiles get views."
              />
            ) : (
              <div className="grid gap-3">
                {data.topProfessionals.map((professional, index) => (
                  <Card key={professional.id} className="p-4">
                    <CardContent className="flex items-center justify-between gap-4 p-0">
                      <div className="flex items-center gap-3">
                        <span className="flex size-7 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
                          {index + 1}
                        </span>
                        <Link
                          href={`${ROUTES.professional}/${professional.slug}`}
                          target="_blank"
                          className="font-medium text-foreground hover:underline"
                        >
                          {professional.businessName ??
                            `${professional.user.firstName} ${professional.user.lastName}`}
                        </Link>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {professional.views} views
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
