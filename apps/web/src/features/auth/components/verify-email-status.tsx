"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { useVerifyEmail } from "../hooks";

export function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const verifyEmail = useVerifyEmail();
  const hasRun = useRef(false);

  useEffect(() => {
    if (token && !hasRun.current) {
      hasRun.current = true;
      verifyEmail.mutate(token);
    }
  }, [token, verifyEmail]);

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        {!token && (
          <>
            <XCircle className="size-10 text-destructive" />
            <CardTitle className="text-xl">Missing verification token</CardTitle>
            <CardDescription>This link is incomplete. Please use the link from your email.</CardDescription>
          </>
        )}
        {token && verifyEmail.isPending && (
          <>
            <Loader2 className="size-10 animate-spin text-primary" />
            <CardTitle className="text-xl">Verifying your email…</CardTitle>
          </>
        )}
        {token && verifyEmail.isSuccess && (
          <>
            <CheckCircle2 className="size-10 text-primary" />
            <CardTitle className="text-xl">Email verified</CardTitle>
            <CardDescription>Your account is ready. You can log in now.</CardDescription>
          </>
        )}
        {token && verifyEmail.isError && (
          <>
            <XCircle className="size-10 text-destructive" />
            <CardTitle className="text-xl">Verification failed</CardTitle>
            <CardDescription>This link is invalid or has expired.</CardDescription>
          </>
        )}
        <Link href={ROUTES.login} className="mt-2 text-sm font-medium text-primary hover:underline">
          Back to login
        </Link>
      </CardContent>
    </Card>
  );
}
