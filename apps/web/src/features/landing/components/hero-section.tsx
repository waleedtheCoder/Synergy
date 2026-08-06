"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { FadeIn } from "./fade-in";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[560px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklch,var(--primary),transparent_88%)_0%,transparent_70%)]"
      />
      <div className="mx-auto max-w-5xl px-4 pt-20 pb-24 text-center sm:px-6 sm:pt-28 lg:px-8">
        <FadeIn>
          <Badge variant="outline" className="mx-auto gap-1.5 px-3 py-1 text-primary">
            <Sparkles className="size-3.5" />
            Now welcoming early professionals
          </Badge>
        </FadeIn>

        <FadeIn delay={0.05}>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
            Find the right construction professional for your project
          </h1>
        </FadeIn>

        <FadeIn delay={0.1}>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-pretty text-muted-foreground">
            Synergi connects homeowners with vetted contractors, architects, and
            tradespeople — compare portfolios, request quotations, and manage
            every project in one place.
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="h-11 px-6 text-base" asChild>
              <Link href={`${ROUTES.register}?role=CLIENT`}>
                Find a professional
                <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-11 px-6 text-base" asChild>
              <Link href={`${ROUTES.register}?role=PROFESSIONAL`}>Join as a professional</Link>
            </Button>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="mx-auto mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" />
            Verified profiles · Secure messaging · No obligation quotes
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
