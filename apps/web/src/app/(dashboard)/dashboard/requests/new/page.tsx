"use client";

import { PageHeader } from "@/features/dashboard/components/page-header";
import { RequestForm } from "@/features/project-requests/components/request-form";

export default function NewRequestPage() {
  return (
    <div>
      <PageHeader
        title="Post a project request"
        description="Tell professionals what you need — you'll start receiving quotations soon."
      />
      <RequestForm />
    </div>
  );
}
