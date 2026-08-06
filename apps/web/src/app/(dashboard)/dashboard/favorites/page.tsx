"use client";

import { useState } from "react";
import { Heart, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { useFavorites, useRemoveFavorite } from "@/features/dashboard/hooks";

export default function FavoritesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useFavorites({ page });
  const removeFavorite = useRemoveFavorite();

  return (
    <div>
      <PageHeader
        title="Favorites"
        description="Professionals you've saved for later."
      />

      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && data && data.items.length === 0 && (
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          description="Once you browse professionals, you can save your favorites here for easy comparison."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((professional) => (
          <Card key={professional.id} className="p-5">
            <CardContent className="flex flex-col gap-3 p-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar size="lg">
                    <AvatarFallback className="bg-accent font-medium text-primary">
                      {professional.user.firstName.charAt(0)}
                      {professional.user.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">
                      {professional.businessName ??
                        `${professional.user.firstName} ${professional.user.lastName}`}
                    </p>
                    {professional.category && (
                      <p className="text-xs text-muted-foreground">{professional.category.name}</p>
                    )}
                  </div>
                </div>
              </div>

              {professional.tagline && (
                <p className="line-clamp-2 text-sm text-muted-foreground">{professional.tagline}</p>
              )}

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="size-3.5 fill-primary text-primary" />
                  {Number(professional.ratingAvg).toFixed(1)} ({professional.ratingCount})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFavorite.mutate(professional.id)}
                  disabled={removeFavorite.isPending}
                >
                  <Heart className="fill-primary text-primary" />
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.meta.page} of {data.meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
