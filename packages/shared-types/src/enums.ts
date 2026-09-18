export enum Role {
  CLIENT = 'CLIENT',
  PROFESSIONAL = 'PROFESSIONAL',
  ADMIN = 'ADMIN',
}

export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export type ReportStatus = 'PENDING' | 'ACTIONED' | 'DISMISSED';

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';

export type AdPlacement =
  | 'HOMEPAGE_HERO'
  | 'HOMEPAGE_MIDDLE'
  | 'SEARCH_SIDEBAR'
  | 'PROFESSIONAL_PROFILE'
  | 'PROJECT_FEED'
  | 'DASHBOARD'
  | 'MOBILE_BANNER';

export type CampaignStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'REJECTED';

export type SubscriptionPlan = 'BASIC' | 'PROFESSIONAL' | 'BUSINESS' | 'ENTERPRISE';

export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';

export type PaymentType = 'SUBSCRIPTION' | 'ADVERTISEMENT' | 'OTHER';

export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';

export type PaymentMethod = 'BANK_TRANSFER' | 'IN_PERSON';

export type AnalyticsEventType =
  | 'PROFILE_VIEW'
  | 'SEARCH_APPEARANCE'
  | 'PROFILE_CLICK'
  | 'INQUIRY';
