import type {
  Role,
  UserStatus,
  ReportStatus,
  DisputeStatus,
  CampaignStatus,
  PaymentStatus,
  PaymentType,
  PaymentMethod,
  SubscriptionPlan,
} from "@synergi/shared-types";

export interface AdminStats {
  users: {
    total: number;
    clients: number;
    professionals: number;
    pending: number;
  };
  projectRequests: {
    total: number;
    open: number;
  };
  moderation: {
    unverifiedProfessionals: number;
    pendingCertificates: number;
    pendingReports: number;
    openDisputes: number;
    pendingCampaigns: number;
    pendingPayments: number;
  };
  revenue: {
    total: number;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  avatarUrl: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AdminUserDetail extends AdminUser {
  phone: string | null;
  authProvider: "LOCAL" | "GOOGLE";
  emailVerifiedAt: string | null;
  clientProfile: { id: string } | null;
  professionalProfile: {
    id: string;
    slug: string;
    verified: boolean;
    businessName: string | null;
  } | null;
}

export interface AdminProfessional {
  id: string;
  slug: string;
  businessName: string | null;
  verified: boolean;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string; avatarUrl: string | null };
  category: { name: string } | null;
  _count: { certificates: number };
}

export interface AdminCertificate {
  id: string;
  title: string;
  issuer: string | null;
  fileUrl: string;
  verified: boolean;
  createdAt: string;
  professional: {
    id: string;
    slug: string;
    businessName: string | null;
    user: { firstName: string; lastName: string };
  };
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parentId: string | null;
}

export interface AdminSkill {
  id: string;
  name: string;
}

export interface AdminReport {
  id: string;
  targetType: "USER" | "REVIEW" | "MESSAGE" | "PORTFOLIO_PROJECT" | "PROJECT_REQUEST";
  targetId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  reporter: { id: string; firstName: string; lastName: string; email: string };
}

export interface AdminDispute {
  id: string;
  reason: string;
  description: string | null;
  status: DisputeStatus;
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
  raisedBy: { id: string; firstName: string; lastName: string; email: string };
  against: { id: string; firstName: string; lastName: string; email: string };
}

export interface AdminCampaign {
  id: string;
  name: string;
  placement: string;
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
  advertiser: {
    companyName: string;
    user: { firstName: string; lastName: string; email: string };
  };
}

export interface AdminPayment {
  id: string;
  type: PaymentType;
  status: PaymentStatus;
  amount: string;
  currency: string;
  method: PaymentMethod;
  reference: string | null;
  targetPlan: SubscriptionPlan | null;
  confirmedAt: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
  subscription: { id: string; plan: SubscriptionPlan } | null;
  campaign: { id: string; name: string } | null;
}
