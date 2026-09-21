import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

// Regenerate periodically instead of freezing at build-time content forever
// (professional/feed listings change independently of app deploys).
export const revalidate = 3600;

interface PaginatedResponse<T> {
  data: { items: T[] };
}

async function safeFetchItems<T>(url: string): Promise<T[]> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const body = (await res.json()) as PaginatedResponse<T>;
    return body.data?.items ?? [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;
  const apiUrl = env.NEXT_PUBLIC_API_URL;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/professionals`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/feed`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/register`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const [professionals, feedItems] = await Promise.all([
    safeFetchItems<{ slug: string }>(`${apiUrl}/search/professionals?limit=100`),
    safeFetchItems<{ id: string }>(`${apiUrl}/feed?limit=100`),
  ]);

  const professionalRoutes: MetadataRoute.Sitemap = professionals.map((p) => ({
    url: `${siteUrl}/professionals/${p.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const feedRoutes: MetadataRoute.Sitemap = feedItems.map((f) => ({
    url: `${siteUrl}/feed/${f.id}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...professionalRoutes, ...feedRoutes];
}
