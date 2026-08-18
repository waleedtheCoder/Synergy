"use client";

import { useState } from "react";
import { Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { useMyCertificates } from "@/features/certificates/hooks";
import { CertificateCard } from "@/features/certificates/components/certificate-card";
import { CertificateFormDialog } from "@/features/certificates/components/certificate-form-dialog";

export default function ProCertificatesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyCertificates({ page });

  return (
    <div>
      <PageHeader
        title="Certificates"
        description="Licenses and certifications that build client confidence."
        action={<CertificateFormDialog />}
      />

      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && data && data.items.length === 0 && (
        <EmptyState
          icon={Award}
          title="No certificates yet"
          description="Add your licenses and certifications so clients know you're qualified."
        />
      )}

      <div className="grid gap-3">
        {data?.items.map((certificate) => (
          <CertificateCard key={certificate.id} certificate={certificate} />
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
