"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "../store/auth-store";
import { fetchCurrentUser } from "../api";

export function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessToken = searchParams.get("accessToken");
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
