import {
  Hammer,
  Zap,
  Droplet,
  Trees,
  Paintbrush,
  Ruler,
  Wrench,
  Home,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { FadeIn } from "./fade-in";

const CATEGORIES = [
  { label: "General contracting", icon: Hammer },
  { label: "Electrical", icon: Zap },
  { label: "Plumbing", icon: Droplet },
  { label: "Landscaping", icon: Trees },
  { label: "Interior design", icon: Paintbrush },
  { label: "Architecture", icon: Ruler },
  { label: "Renovations", icon: Wrench },
  { label: "Roofing", icon: Home },
];

export function CategoriesSection() {
  return (
    <section id="categories" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <FadeIn className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Every trade, one marketplace
        </h2>
        <p className="mt-4 text-muted-foreground">
          Browse portfolios from professionals across every construction and design discipline.
        </p>
      </FadeIn>

      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map((category, index) => {
          const Icon = category.icon;
          return (
            <FadeIn key={category.label} delay={index * 0.04}>
              <Card className="group cursor-pointer items-center gap-3 p-6 text-center transition-shadow hover:shadow-md">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-accent transition-colors group-hover:bg-primary">
                  <Icon className="size-5 text-primary transition-colors group-hover:text-primary-foreground" />
                </div>
                <p className="mt-1 text-sm font-medium text-foreground">{category.label}</p>
              </Card>
            </FadeIn>
          );
        })}
      </div>
    </section>
  );
}
