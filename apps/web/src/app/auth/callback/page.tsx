import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { OAuthCallback } from "@/features/auth/components/oauth-callback";

export const metadata: Metadata = { title: "Signing in" };

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <Link href={ROUTES.home} className="mb-8 text-2xl font-semibold tracking-tight text-foreground">
        Syn<span className="text-primary">ergi</span>
      </Link>
      <div className="w-full max-w-md">
        <Suspense>
          <OAuthCallback />
        </Suspense>
      </div>
    </div>
  );
}
