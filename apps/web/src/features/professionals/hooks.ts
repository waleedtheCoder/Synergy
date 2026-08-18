import { useQuery } from "@tanstack/react-query";
import { fetchProfessionalBySlug } from "./api";

export function usePublicProfessional(slug: string) {
  return useQuery({
    queryKey: ["professionals", slug],
    queryFn: () => fetchProfessionalBySlug(slug),
    enabled: Boolean(slug),
  });
}
