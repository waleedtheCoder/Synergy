export interface PortfolioImage {
  id: string;
  url: string;
  type: "IMAGE" | "PDF" | "VIDEO" | "DOCUMENT";
  caption: string | null;
  order: number;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  budgetMin: string | null;
  budgetMax: string | null;
  published: boolean;
  likesCount: number;
  bookmarksCount: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string; slug: string } | null;
  images: PortfolioImage[];
}
