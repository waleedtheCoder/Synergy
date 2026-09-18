import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import * as api from "./api";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? fallback;
  }
  return fallback;
}

export function usePlans() {
  return useQuery({
    queryKey: ["subscriptions", "plans"],
    queryFn: api.fetchPlans,
  });
}

export function useMySubscription() {
  return useQuery({
    queryKey: ["subscriptions", "me"],
    queryFn: api.fetchMySubscription,
  });
}

export function useDowngradeToBasic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.downgradeToBasic,
    onSuccess: () => {
      toast.success("Downgraded to the free Basic plan");
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Could not downgrade")),
  });
}
