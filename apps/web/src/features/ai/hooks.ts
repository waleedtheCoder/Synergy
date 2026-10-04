import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import * as api from "./api";

export function aiErrorMessage(error: unknown, fallback = "The AI assistant is unavailable right now"): string {
  if (error instanceof AxiosError) {
    if (error.response?.status === 429) return "Too many AI requests — please wait a minute and try again";
    return (error.response?.data as { message?: string } | undefined)?.message ?? fallback;
  }
  return fallback;
}

/** Whether answer generation is configured on the server. */
export function useAiEnabled() {
  const { data } = useQuery({
    queryKey: ["ai", "status"],
    queryFn: api.fetchAiStatus,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  return data?.enabled ?? false;
}

export function useAskHelp() {
  return useMutation({ mutationFn: api.askHelp });
}

export function useAskAboutProfessional(professionalId: string) {
  return useMutation({
    mutationFn: (question: string) => api.askAboutProfessional(professionalId, question),
  });
}

// Matching is generated on demand (it calls a paid API), so the query is
// disabled until the client asks for it.
export function useProjectMatches(requestId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["ai", "matches", requestId],
    queryFn: () => api.fetchProjectMatches(requestId),
    enabled: enabled && Boolean(requestId),
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}

export function useAskAboutChat(chatId: string) {
  return useMutation({
    mutationFn: (question?: string) => api.askAboutChat(chatId, question),
  });
}

export function useDraftQuotation(chatId: string) {
  return useMutation({
    mutationFn: (instructions?: string) => api.draftQuotation(chatId, instructions),
    onError: (error) => {
      toast.error(aiErrorMessage(error, "Could not draft the quotation"));
    },
  });
}

export function useReportAssessment(reportId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["ai", "report-assessment", reportId],
    queryFn: () => api.fetchReportAssessment(reportId),
    enabled,
    staleTime: Infinity,
    retry: false,
  });
}

export function useDisputeAssessment(disputeId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["ai", "dispute-assessment", disputeId],
    queryFn: () => api.fetchDisputeAssessment(disputeId),
    enabled,
    staleTime: Infinity,
    retry: false,
  });
}
