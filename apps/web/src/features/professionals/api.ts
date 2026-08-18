import { apiClient } from "@/lib/api-client";
import type { PublicProfessionalProfile } from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function fetchProfessionalBySlug(slug: string) {
  const { data } = await apiClient.get<ApiEnvelope<PublicProfessionalProfile>>(
    `/professionals/${slug}`,
  );
  return data.data;
}
