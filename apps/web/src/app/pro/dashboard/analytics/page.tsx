"use client";

import { useState } from "react";
import { Eye, Loader2, MessageSquare, MousePointerClick, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { useMyAnalytics } from "@/features/analytics/hooks";
import { StatTile } from "@/features/analytics/components/stat-tile";
import { EventChart } from "@/features/analytics/components/event-chart";

const RANGE_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

export default function ProAnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useMyAnalytics(days);

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="How clients are discovering and engaging with your profile."
      />

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
        </div>
      )}
    </div>
  );
}
