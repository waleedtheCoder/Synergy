import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HeroSection } from "@/features/landing/components/hero-section";
import { CategoriesSection } from "@/features/landing/components/categories-section";
import { HowItWorksSection } from "@/features/landing/components/how-it-works-section";
import { ForProfessionalsSection } from "@/features/landing/components/for-professionals-section";
import { CtaSection } from "@/features/landing/components/cta-section";
import { AdSlot } from "@/features/advertising/components/ad-slot";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <CategoriesSection />
        <HowItWorksSection />
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <AdSlot placement="HOMEPAGE_MIDDLE" />
        </div>
        <ForProfessionalsSection />
        <CtaSection />
      </main>
      <SiteFooter />

      <AdSlot
        placement="MOBILE_BANNER"
        className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-sm border-t border-border/60 bg-background p-2 sm:hidden"
      />
    </div>
  );
}
