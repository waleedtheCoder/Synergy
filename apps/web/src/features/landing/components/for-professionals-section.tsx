"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { FadeIn } from "./fade-in";

const PERKS = [
  { icon: Users, text: "Reach homeowners actively looking to hire" },
  { icon: BadgeCheck, text: "Build a verified portfolio that wins trust" },
  { icon: TrendingUp, text: "Grow your pipeline with quotations and messaging tools" },
];

export function ForProfessionalsSection() {
  return (
    <section id="for-professionals" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="grid items-center gap-12 rounded-3xl bg-foreground px-8 py-14 sm:px-14 lg:grid-cols-2">
        <FadeIn>
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">
            For professionals
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-background sm:text-4xl">
            Showcase your work. Win better projects.
          </h2>
          <p className="mt-4 text-background/70">
            Create a professional profile, share your portfolio, and connect with clients
            who are ready to hire — no cold outreach required.
          </p>
          <Button size="lg" className="mt-8 h-11 px-6 text-base" asChild>
            <Link href={`${ROUTES.register}?role=PROFESSIONAL`}>
              Create your profile
              <ArrowRight />
            </Link>
          </Button>
        </FadeIn>

        <FadeIn delay={0.1} className="grid gap-4">
          {PERKS.map((perk) => {
            const Icon = perk.icon;
            return (
              <div
                key={perk.text}
                className="flex items-center gap-4 rounded-2xl bg-background/10 p-4"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/20">
                  <Icon className="size-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-background">{perk.text}</p>
              </div>
            );
          })}
        </FadeIn>
      </div>
    </section>
  );
}
