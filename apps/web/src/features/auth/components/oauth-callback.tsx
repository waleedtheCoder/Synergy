"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "../store/auth-store";
import { fetchCurrentUser } from "../api";
import { useCompleteGoogleTwoFactor } from "../hooks";

function TwoFactorStep({ pendingToken }: { pendingToken: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const completeTwoFactor = useCompleteGoogleTwoFactor();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    completeTwoFactor.mutate(
      { pendingToken, otpCode: code },
      { onSuccess: () => router.replace(ROUTES.home) },
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
        <CardTitle className="text-xl">Enter your 2FA code</CardTitle>
        <CardDescription>
          This account has two-factor authentication enabled. Enter the code from
          your authenticator app, or a recovery code, to finish signing in.
        </CardDescription>
        <form onSubmit={onSubmit} className="grid w-full gap-3">
          <Input
            autoFocus
            inputMode="text"
            autoComplete="one-time-code"
            placeholder="123456"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <Button type="submit" className="h-10 w-full" disabled={completeTwoFactor.isPending || !code}>
            {completeTwoFactor.isPending && <Loader2 className="size-4 animate-spin" />}
            Verify
          </Button>
        </form>
        <Link href={ROUTES.login} className="text-sm font-medium text-primary hover:underline">
          Back to login
        </Link>
      </CardContent>
    </Card>
  );
}

export function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessToken = searchParams.get("accessToken");
  const pendingToken = searchParams.get("pending2fa");
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setSession = useAuthStore((state) => state.setSession);
  const hasRun = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!accessToken || hasRun.current) return;
    hasRun.current = true;

    setAccessToken(accessToken);
    fetchCurrentUser()
      .then((user) => {
        setSession({ user, accessToken });
        router.replace(ROUTES.home);
      })
      .catch(() => setFailed(true));
  }, [accessToken, router, setAccessToken, setSession]);

  if (pendingToken) {
    return <TwoFactorStep pendingToken={pendingToken} />;
  }

  if (!accessToken || failed) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <XCircle className="size-10 text-destructive" />
          <CardTitle className="text-xl">Sign-in failed</CardTitle>
          <CardDescription>We couldn&apos;t complete Google sign-in. Please try again.</CardDescription>
          <Link href={ROUTES.login} className="mt-2 text-sm font-medium text-primary hover:underline">
            Back to login
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <Loader2 className="size-10 animate-spin text-primary" />
        <CardTitle className="text-xl">Signing you in…</CardTitle>
      </CardContent>
    </Card>
  );
}
