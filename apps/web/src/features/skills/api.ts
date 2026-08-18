import { apiClient } from "@/lib/api-client";
import type { Skill } from "./types";

export async function fetchSkills() {
  const { data } = await apiClient.get<{ success: boolean; data: Skill[] }>("/skills");
  return data.data;
}
