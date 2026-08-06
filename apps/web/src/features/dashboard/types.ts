export type NotificationType =
  | "MESSAGE"
  | "QUOTATION"
  | "REVIEW"
  | "BOOKING"
  | "PAYMENT"
  | "SYSTEM"
  | "PROMOTION"
  | "MEETING";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface FavoriteProfessional {
  id: string;
  slug: string;
  businessName: string | null;
  tagline: string | null;
  ratingAvg: string;
  ratingCount: number;
  favoritedAt: string;
  user: { firstName: string; lastName: string; avatarUrl: string | null };
  category: { id: string; name: string } | null;
}

export interface Profile {
  id: string;
  email: string;
  role: "CLIENT" | "PROFESSIONAL" | "ADMIN";
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  address: string | null;
}
