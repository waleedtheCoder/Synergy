import { apiClient } from "@/lib/api-client";
import type { ProfessionalProfile } from "./types";
import type { UpdateProfessionalProfilePayload } from "./schemas";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function fetchProfessionalProfile() {
  const { data } = await apiClient.get<ApiEnvelope<ProfessionalProfile>>(
    "/professional-profile/me",
  );
  return data.data;
}

export async function updateProfessionalProfile(input: UpdateProfessionalProfilePayload) {
  const { data } = await apiClient.patch<ApiEnvelope<ProfessionalProfile>>(
    "/professional-profile/me",
    input,
  );
  return data.data;
}
