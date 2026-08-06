import { FileText, MessagesSquare, CheckCircle2 } from "lucide-react";
import { FadeIn } from "./fade-in";

const STEPS = [
  {
    icon: FileText,
    title: "Post your project",
    description:
      "Describe what you need — from a small repair to a full renovation — and set your budget and timeline.",
  },
  {
    icon: MessagesSquare,
    title: "Compare quotations",
    description:
      "Message vetted professionals directly, review portfolios, and request itemized quotations side by side.",
  },
  {
    icon: CheckCircle2,
    title: "Hire with confidence",
    description:
      "Schedule meetings, agree on scope, and manage the project through to completion — all in one place.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-muted/40 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            How Synergi works
          </h2>
          <p className="mt-4 text-muted-foreground">
            Three steps between you and the right professional for the job.
          </p>
        </FadeIn>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <FadeIn key={step.title} delay={index * 0.1} className="relative">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Icon className="size-5" />
                </div>
                <p className="mt-5 text-xs font-semibold tracking-wide text-primary uppercase">
                  Step {index + 1}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
