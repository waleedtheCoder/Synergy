"use client";

import { useState } from "react";
import { Briefcase, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { useMyServices } from "@/features/services/hooks";
import { ServiceCard } from "@/features/services/components/service-card";
import { ServiceFormDialog } from "@/features/services/components/service-form-dialog";

export default function ProServicesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyServices({ page });

  return (
    <div>
      <PageHeader
        title="Services"
        description="The services you offer, and how you price them."
        action={<ServiceFormDialog trigger={<Button>Add service</Button>} />}
      />

      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && data && data.items.length === 0 && (
        <EmptyState
          icon={Briefcase}
          title="No services yet"
          description="Add the services you offer so clients know what you can do for them."
          action={<ServiceFormDialog trigger={<Button className="mt-2">Add service</Button>} />}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((service) => (
          <ServiceCard key={service.id} service={service} />
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
