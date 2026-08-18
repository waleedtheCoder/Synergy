export interface PublicSkill {
  id: string;
  name: string;
}

export interface PublicCertificate {
  id: string;
  title: string;
  issuer: string | null;
  issueDate: string | null;
  fileUrl: string;
  verified: boolean;
}

export type PublicPriceType = "FIXED" | "HOURLY" | "QUOTE";

export interface PublicService {
  id: string;
  title: string;
  description: string | null;
  priceType: PublicPriceType;
  price: string | null;
  minPrice: string | null;
  maxPrice: string | null;
  category: { id: string; name: string; slug: string } | null;
}

export interface PublicPortfolioImage {
  id: string;
  url: string;
  caption: string | null;
}

export interface PublicPortfolioProject {
  id: string;
  title: string;
  location: string | null;
  images: PublicPortfolioImage[];
}

export interface PublicProfessionalProfile {
  id: string;
  businessName: string | null;
  slug: string;
  tagline: string | null;
  about: string | null;
  coverImageUrl: string | null;
  yearsExperience: number | null;
  languages: string[];
  responseTime: "WITHIN_HOUR" | "WITHIN_DAY" | "WITHIN_WEEK" | null;
  availability: "AVAILABLE" | "BUSY" | "UNAVAILABLE";
  hourlyRateMin: string | null;
  hourlyRateMax: string | null;
  verified: boolean;
  ratingAvg: string;
  ratingCount: number;
  completedProjectsCount: number;
  profileViewsCount: number;
  user: { firstName: string; lastName: string; avatarUrl: string | null };
  category: { id: string; name: string; slug: string } | null;
  city: { id: string; name: string } | null;
  skills: PublicSkill[];
  certificates: PublicCertificate[];
  services: PublicService[];
  portfolioProjects: PublicPortfolioProject[];
}
