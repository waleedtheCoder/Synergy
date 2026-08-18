import { useQuery } from "@tanstack/react-query";
import { searchProfessionals } from "./api";
import type { SearchProfessionalsParams } from "./types";

export function useSearchProfessionals(params: SearchProfessionalsParams) {
  return useQuery({
    queryKey: ["search", "professionals", params],
    queryFn: () => searchProfessionals(params),
    placeholderData: (previous) => previous,
  });
}
