export type PriceType = "FIXED" | "HOURLY" | "QUOTE";

export interface Service {
  id: string;
  title: string;
  description: string | null;
  priceType: PriceType;
  price: string | null;
  minPrice: string | null;
  maxPrice: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string; slug: string } | null;
}
