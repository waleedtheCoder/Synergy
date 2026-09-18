"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import {
  useAdminProfessionals,
  useAdminCertificates,
  useSetProfessionalVerified,
  useSetCertificateVerified,
} from "@/features/admin/hooks";

const TABS = [
  { value: "professionals", label: "Professionals" },
  { value: "certificates", label: "Certificates" },
] as const;

function ProfessionalsTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminProfessionals({ page, verified: false });
  const setVerified = useSetProfessionalVerified();

  if (!isLoading && data && data.items.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Nothing pending"
        description="All professional profiles are verified."
      />
    );
  }

  return (
    <div>
      <div className="grid gap-3">
        {data?.items.map((professional) => (
          <Card key={professional.id} className="p-4">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-0">
              <div>
                <p className="font-medium text-foreground">
                  {professional.businessName ??
                    `${professional.user.firstName} ${professional.user.lastName}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {professional.user.email} · {professional.category?.name ?? "Uncategorized"} ·{" "}
                  {professional._count.certificates} certificate(s)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={professional.verified ? "secondary" : "outline"}>
                  {professional.verified ? "Verified" : "Unverified"}
                </Badge>
                <Button
                  size="sm"
                  onClick={() =>
                    setVerified.mutate({ id: professional.id, verified: !professional.verified })
                  }
                >
                  {professional.verified ? "Unverify" : "Verify"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft />
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
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}

function CertificatesTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminCertificates({ page, verified: false });
  const setVerified = useSetCertificateVerified();

  if (!isLoading && data && data.items.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Nothing pending"
        description="All certificates are verified."
      />
    );
  }

  return (
    <div>
      <div className="grid gap-3">
        {data?.items.map((certificate) => (
          <Card key={certificate.id} className="p-4">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-0">
              <div>
                <p className="font-medium text-foreground">{certificate.title}</p>
                <p className="text-sm text-muted-foreground">
                  {certificate.issuer ?? "Unknown issuer"} ·{" "}
                  {certificate.professional.businessName ??
                    `${certificate.professional.user.firstName} ${certificate.professional.user.lastName}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={certificate.fileUrl} target="_blank" rel="noreferrer">
                    View file
                  </a>
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    setVerified.mutate({ id: certificate.id, verified: !certificate.verified })
                  }
                >
                  {certificate.verified ? "Unverify" : "Verify"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft />
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
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AdminVerificationPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("professionals");

  return (
    <div>
      <PageHeader
        title="Verification"
        description="Review and approve professional profiles and certificates."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.value}
            onClick={() => setTab(item.value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              tab === item.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "professionals" ? <ProfessionalsTab /> : <CertificatesTab />}
    </div>
  );
}
