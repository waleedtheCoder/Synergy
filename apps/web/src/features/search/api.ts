import { apiClient } from "@/lib/api-client";
import type { PaginatedResult } from "@/lib/pagination";
import type { ProfessionalSearchHit, SearchProfessionalsParams } from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function searchProfessionals(params: SearchProfessionalsParams) {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<ProfessionalSearchHit>>>(
    "/search/professionals",
    {
      params: {
        ...params,
        skillIds: params.skillIds && params.skillIds.length > 0 ? params.skillIds.join(",") : undefined,
      },
    },
  );
  return data.data;
}
