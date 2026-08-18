export type ResponseTime = "WITHIN_HOUR" | "WITHIN_DAY" | "WITHIN_WEEK";
export type AvailabilityStatus = "AVAILABLE" | "BUSY" | "UNAVAILABLE";

export interface ProfessionalProfile {
  id: string;
  userId: string;
  businessName: string | null;
  slug: string;
  tagline: string | null;
  about: string | null;
  coverImageUrl: string | null;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  yearsExperience: number | null;
  languages: string[];
  responseTime: ResponseTime | null;
  availability: AvailabilityStatus;
  hourlyRateMin: string | null;
  hourlyRateMax: string | null;
  verified: boolean;
  verificationBadges: string[];
  ratingAvg: string;
  ratingCount: number;
  completedProjectsCount: number;
  profileViewsCount: number;
  skills: { id: string; name: string }[];
  servicesCount: number;
  portfolioCount: number;
  certificatesCount: number;
  createdAt: string;
  updatedAt: string;
}
