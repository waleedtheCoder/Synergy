"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { useMyAdvertiser, useMyCampaigns } from "@/features/advertising/hooks";
import { BecomeAdvertiserCard } from "@/features/advertising/components/become-advertiser-card";
import { CampaignFormDialog } from "@/features/advertising/components/campaign-form-dialog";
import { CampaignCard } from "@/features/advertising/components/campaign-card";

export default function AdvertiserPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (isHydrated && !user) {
      router.replace(ROUTES.login);
    }
  }, [isHydrated, user, router]);

  const { data: advertiser, isLoading: isLoadingAdvertiser, isError } = useMyAdvertiser();
  const { data: campaigns, isLoading: isLoadingCampaigns } = useMyCampaigns(
    { page },
    { enabled: !!advertiser },
  );

  if (!isHydrated || !user || isLoadingAdvertiser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          {isError || !advertiser ? (
            <BecomeAdvertiserCard />
          ) : (
            <div>
              <PageHeader
                title="Your campaigns"
                description={`Advertising as ${advertiser.companyName}`}
                action={<CampaignFormDialog />}
              />

              {!isLoadingCampaigns && campaigns && campaigns.items.length === 0 && (
                <EmptyState
                  icon={Megaphone}
                  title="No campaigns yet"
                  description="Create your first campaign to start reaching users."
                />
              )}

              <div className="grid gap-4">
                {campaigns?.items.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>

              {campaigns && campaigns.meta.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {campaigns.meta.page} of {campaigns.meta.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= campaigns.meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
