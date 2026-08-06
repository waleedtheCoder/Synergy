import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailStatus } from "@/features/auth/components/verify-email-status";

export const metadata: Metadata = { title: "Verify email" };

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailStatus />
    </Suspense>
  );
}
