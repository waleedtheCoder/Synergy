"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Check, Loader2, Sparkles, Star, TriangleAlert } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { aiErrorMessage, useProjectMatches } from "../hooks";
import type { MatchFit, ProfessionalMatch } from "../types";
import { AiDisclaimer } from "./ai-answer";

const FIT_STYLES: Record<MatchFit, { label: string; className: string }> = {
  strong: { label: "Strong fit", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  good: { label: "Good fit", className: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300" },
  partial: { label: "Partial fit", className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  weak: { label: "Weak fit", className: "bg-muted text-muted-foreground" },
};

function MatchCard({ match }: { match: ProfessionalMatch }) {
  const { professional } = match;
  const name = professional.businessName ?? `${professional.user.firstName} ${professional.user.lastName}`;
  const fit = match.fit ? FIT_STYLES[match.fit] : null;

  return (
    <Card className="p-4">
      <CardContent className="grid gap-3 p-0">
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarFallback className="bg-accent font-medium text-primary">
              {professional.user.firstName.charAt(0)}
              {professional.user.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`${ROUTES.professional}/${professional.slug}`}
                className="font-medium text-foreground hover:underline"
              >
                {name}
              </Link>
              {professional.verified && <BadgeCheck className="size-4 text-primary" aria-label="Verified" />}
              {fit && (
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", fit.className)}>{fit.label}</span>
              )}
            </div>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
              {professional.category && <span>{professional.category.name}</span>}
              {professional.city && <span>{professional.city.name}</span>}
              {professional.ratingCount > 0 && (
                <span className="flex items-center gap-0.5">
                  <Star className="size-3 fill-current" />
                  {Number(professional.ratingAvg).toFixed(1)} ({professional.ratingCount})
                </span>
              )}
            </p>
          </div>
        </div>

        {match.summary && <p className="text-sm text-foreground">{match.summary}</p>}

        {match.highlights.length > 0 && (
          <ul className="grid gap-1">
            {match.highlights.map((highlight) => (
              <li key={highlight} className="flex gap-2 text-sm text-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                {highlight}
              </li>
            ))}
          </ul>
        )}
        {match.considerations.length > 0 && (
          <ul className="grid gap-1">
            {match.considerations.map((consideration) => (
              <li key={consideration} className="flex gap-2 text-sm text-muted-foreground">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
                {consideration}
              </li>
            ))}
          </ul>
        )}

        {!match.summary && match.evidence.length > 0 && (
          <div className="grid gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">Most relevant to your project</p>
            {match.evidence.slice(0, 2).map((item, index) => (
              <p key={index} className="text-xs text-muted-foreground">
                <Badge variant="outline" className="mr-1.5">
                  {item.label}
                </Badge>
                {item.snippet}
              </p>
            ))}
          </div>
        )}

        <Button asChild variant="outline" size="sm" className="w-fit">
          <Link href={`${ROUTES.professional}/${professional.slug}`}>View profile</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function ProjectMatches({ requestId }: { requestId: string }) {
  const [requested, setRequested] = useState(false);
  const { data, isFetching, error, refetch } = useProjectMatches(requestId, requested);

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Recommended professionals</h2>
          <p className="text-sm text-muted-foreground">
            Matched to your request by comparing it with professionals&apos; portfolios, services and reviews.
          </p>
        </div>
        {!requested && (
          <Button onClick={() => setRequested(true)}>
            <Sparkles />
            Find matching professionals
          </Button>
        )}
      </div>

      {isFetching && (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Finding and comparing professionals…
        </div>
      )}

      {error && !isFetching && (
        <div className="flex items-center gap-3 text-sm text-destructive">
          {aiErrorMessage(error, "Could not load recommendations")}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {data && !isFetching && (
        <>
          {data.matches.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              No professionals match this request yet. Try adding more detail to the description.
            </p>
          ) : (
            <div className="grid gap-3">
              {data.matches.map((match) => (
                <MatchCard key={match.professional.id} match={match} />
              ))}
            </div>
          )}
          {data.aiExplained && <AiDisclaimer className="mt-3" />}
        </>
      )}
    </section>
  );
}
