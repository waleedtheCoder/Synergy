import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import type { ProfessionalSearchHit } from "../types";

function formatRate(min: number | null, max: number | null) {
  if (!min && !max) return null;
  const a = min ? `$${min.toLocaleString()}` : null;
  const b = max ? `$${max.toLocaleString()}` : null;
  return `${a && b ? `${a} – ${b}` : (a ?? b)}/hr`;
}

export function ProfessionalSearchCard({ hit }: { hit: ProfessionalSearchHit }) {
  const name = hit.businessName ?? `${hit.firstName} ${hit.lastName}`;
  const rate = formatRate(hit.hourlyRateMin, hit.hourlyRateMax);

  return (
    <Link href={`${ROUTES.professional}/${hit.slug}`}>
      <Card className="p-5 transition-shadow hover:shadow-md">
        <CardContent className="flex flex-col gap-3 p-0">
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback className="bg-accent font-medium text-primary">
                {hit.firstName.charAt(0)}
                {hit.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate font-semibold text-foreground">{name}</p>
                {hit.verified && <BadgeCheck className="size-4 shrink-0 text-primary" />}
              </div>
              {hit.categoryName && <p className="text-xs text-muted-foreground">{hit.categoryName}</p>}
            </div>
          </div>

          {hit.tagline && <p className="line-clamp-2 text-sm text-muted-foreground">{hit.tagline}</p>}

          {hit.skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {hit.skills.slice(0, 4).map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="size-3.5 fill-primary text-primary" />
              {hit.ratingAvg.toFixed(1)} ({hit.ratingCount})
            </span>
            {rate && <span>{rate}</span>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
