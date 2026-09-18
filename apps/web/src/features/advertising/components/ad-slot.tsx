"use client";

import { cn } from "@/lib/utils";
import { useServedAd } from "../hooks";
import { recordAdClick } from "../api";
import type { AdPlacement } from "../types";

export function AdSlot({ placement, className }: { placement: AdPlacement; className?: string }) {
  const { data: ad, isLoading } = useServedAd(placement);

  if (isLoading || !ad) return null;

  return (
    <a
      href={ad.targetUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={() => {
        recordAdClick(ad.id).catch(() => {});
      }}
      className={cn("block overflow-hidden rounded-2xl", className)}
    >
      <span className="mb-1 block text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        Sponsored
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element -- external, advertiser-supplied banner images */}
      <img src={ad.bannerImageUrl} alt="" className="h-auto w-full rounded-2xl object-cover" />
    </a>
  );
}
