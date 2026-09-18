import { useQuery } from "@tanstack/react-query";
import * as api from "./api";

export function useMyAnalytics(days: number) {
  return useQuery({
    queryKey: ["analytics", "me", days],
    queryFn: () => api.fetchMyAnalytics(days),
  });
}

export function useAdminAnalytics(days: number) {
  return useQuery({
    queryKey: ["admin", "analytics", days],
    queryFn: () => api.fetchAdminAnalytics(days),
  });
}
