export type FeedMediaType = "IMAGE" | "PDF" | "VIDEO" | "DOCUMENT";

export interface FeedProjectImage {
  id: string;
  url: string;
  type: FeedMediaType;
  caption: string | null;
  order: number;
}

export interface FeedProfessional {
  id: string;
  slug: string;
  businessName: string | null;
  verified: boolean;
  user: { firstName: string; lastName: string; avatarUrl: string | null };
}

export interface FeedProject {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  budgetMin: string | null;
  budgetMax: string | null;
  likesCount: number;
  bookmarksCount: number;
  completedAt: string | null;
  createdAt: string;
  category: { id: string; name: string; slug: string } | null;
  images: FeedProjectImage[];
  professional: FeedProfessional;
  isLiked: boolean;
  isBookmarked: boolean;
}

export interface FeedComment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
}
