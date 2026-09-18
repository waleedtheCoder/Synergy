import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import type { PaymentStatus } from "@synergi/shared-types";
import * as api from "./api";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? fallback;
  }
  return fallback;
}

export function usePaymentInstructions() {
  return useQuery({
    queryKey: ["payments", "instructions"],
    queryFn: api.fetchPaymentInstructions,
  });
}

export function useMyPayments(params: { page?: number; status?: PaymentStatus }) {
  return useQuery({
    queryKey: ["payments", "me", params],
    queryFn: () => api.fetchMyPayments(params),
  });
}

export function useCreateSubscriptionPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createSubscriptionPayment,
    onSuccess: () => {
      toast.success("Payment claim submitted — awaiting confirmation");
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Could not submit payment")),
  });
}

export function useCreateCampaignPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      input,
    }: {
      campaignId: string;
      input: { method: "BANK_TRANSFER" | "IN_PERSON"; reference?: string };
    }) => api.createCampaignPayment(campaignId, input),
    onSuccess: () => {
      toast.success("Payment claim submitted — awaiting confirmation");
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
      void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Could not submit payment")),
  });
}
