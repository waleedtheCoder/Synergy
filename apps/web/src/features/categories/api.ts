import { apiClient } from "@/lib/api-client";
import type { Category } from "./types";

export async function fetchCategories() {
  const { data } = await apiClient.get<{ success: boolean; data: Category[] }>(
    "/categories",
  );
  return data.data;
}
