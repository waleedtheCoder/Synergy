"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { FadeIn } from "./fade-in";

export function CtaSection() {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
      <FadeIn className="flex flex-col items-center gap-6 rounded-3xl border border-border bg-accent/40 px-8 py-16 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Ready to get started?
        </h2>
        <p className="max-w-xl text-muted-foreground">
          Join Synergi today and take the guesswork out of finding — or being found by —
          the right construction professional.
        </p>
        <Button size="lg" className="h-11 px-6 text-base" asChild>
          <Link href={ROUTES.register}>
            Create your free account
            <ArrowRight />
          </Link>
        </Button>
      </FadeIn>
    </section>
  );
}
