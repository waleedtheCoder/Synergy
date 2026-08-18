import { useQuery } from "@tanstack/react-query";
import { fetchSkills } from "./api";

export function useSkills() {
  return useQuery({
    queryKey: ["skills"],
    queryFn: fetchSkills,
    staleTime: 10 * 60 * 1000,
  });
}
