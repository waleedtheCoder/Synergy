import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HeroSection } from "@/features/landing/components/hero-section";
import { CategoriesSection } from "@/features/landing/components/categories-section";
import { HowItWorksSection } from "@/features/landing/components/how-it-works-section";
import { ForProfessionalsSection } from "@/features/landing/components/for-professionals-section";
import { CtaSection } from "@/features/landing/components/cta-section";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <CategoriesSection />
        <HowItWorksSection />
        <ForProfessionalsSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
