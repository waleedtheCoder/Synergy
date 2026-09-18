import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import type { CampaignStatus, AdPlacement } from "./types";
import * as api from "./api";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? fallback;
  }
  return fallback;
}

export function useMyAdvertiser() {
  return useQuery({
    queryKey: ["advertiser", "me"],
    queryFn: api.fetchMyAdvertiser,
    retry: false,
  });
}

export function useCreateAdvertiser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createAdvertiser,
    onSuccess: () => {
      toast.success("You're now registered as an advertiser");
      void queryClient.invalidateQueries({ queryKey: ["advertiser"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Could not register as an advertiser")),
  });
}

export function useMyCampaigns(
  params: { page?: number; status?: CampaignStatus },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["campaigns", "me", params],
    queryFn: () => api.fetchMyCampaigns(params),
    enabled: options?.enabled,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createCampaign,
    onSuccess: () => {
      toast.success("Campaign created as a draft");
      void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Could not create campaign")),
  });
}

function useCampaignAction(
  mutationFn: (id: string) => Promise<unknown>,
  successMessage: string,
  fallbackError: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(successMessage);
      void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (error) => toast.error(errorMessage(error, fallbackError)),
  });
}

export function useSubmitCampaign() {
  return useCampaignAction(api.submitCampaign, "Campaign submitted for review", "Could not submit campaign");
}

export function usePauseCampaign() {
  return useCampaignAction(api.pauseCampaign, "Campaign paused", "Could not pause campaign");
}

export function useResumeCampaign() {
  return useCampaignAction(api.resumeCampaign, "Campaign resumed", "Could not resume campaign");
}

export function useStopCampaign() {
  return useCampaignAction(api.stopCampaign, "Campaign stopped", "Could not stop campaign");
}

export function useDeleteCampaign() {
  return useCampaignAction(api.deleteCampaign, "Campaign deleted", "Could not delete campaign");
}

export function useServedAd(placement: AdPlacement) {
  return useQuery({
    queryKey: ["ads", "serve", placement],
    queryFn: () => api.fetchServedAd(placement),
    staleTime: 60_000,
  });
}
