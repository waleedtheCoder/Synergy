export type AvailabilityStatus = "AVAILABLE" | "BUSY" | "UNAVAILABLE";
export type SearchSort = "relevance" | "rating" | "newest" | "priceAsc" | "priceDesc";

export interface ProfessionalSearchHit {
  id: string;
  slug: string;
  businessName: string | null;
  tagline: string | null;
  about: string | null;
  coverImageUrl: string | null;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  cityId: string | null;
  cityName: string | null;
  skillIds: string[];
  skills: string[];
  languages: string[];
  availability: AvailabilityStatus;
  responseTime: string | null;
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  verified: boolean;
  ratingAvg: number;
  ratingCount: number;
  completedProjectsCount: number;
  createdAt: number;
}

export interface SearchProfessionalsParams {
  q?: string;
  categoryId?: string;
  skillIds?: string[];
  availability?: AvailabilityStatus;
  verifiedOnly?: boolean;
  minRating?: number;
  sort?: SearchSort;
  page?: number;
}
