"use client";

import { useState } from "react";
import { Images, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { useMyPortfolioProjects } from "@/features/portfolio/hooks";
import { PortfolioCard } from "@/features/portfolio/components/portfolio-card";
import { PortfolioFormDialog } from "@/features/portfolio/components/portfolio-form-dialog";

export default function ProPortfolioPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyPortfolioProjects({ page });

  return (
    <div>
      <PageHeader
        title="Portfolio"
        description="Showcase completed projects to build trust with prospective clients."
        action={<PortfolioFormDialog trigger={<Button>Add project</Button>} />}
      />

      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && data && data.items.length === 0 && (
        <EmptyState
          icon={Images}
          title="No portfolio projects yet"
          description="Add photos and details from your past work to showcase your craftsmanship."
          action={<PortfolioFormDialog trigger={<Button className="mt-2">Add project</Button>} />}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((project) => (
          <PortfolioCard key={project.id} project={project} />
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
