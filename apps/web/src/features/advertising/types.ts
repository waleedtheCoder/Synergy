import type { AdPlacement, CampaignStatus, PaymentStatus } from "@synergi/shared-types";

export interface Advertiser {
  id: string;
  userId: string;
  companyName: string;
  billingEmail: string | null;
  createdAt: string;
}

export interface Campaign {
  id: string;
  advertiserId: string;
  name: string;
  placement: AdPlacement;
  bannerImageUrl: string;
  targetUrl: string;
  budget: string;
  spend: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
  payments: { status: PaymentStatus }[];
}

export interface ServedAd {
  id: string;
  bannerImageUrl: string;
  targetUrl: string;
}

export type { AdPlacement, CampaignStatus };
