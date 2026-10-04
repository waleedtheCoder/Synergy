import { apiClient } from "@/lib/api-client";
import type {
  AiAnswer,
  AiStatus,
  ChatAnswer,
  DisputeAssessment,
  HelpAnswer,
  MatchResult,
  QuotationDraft,
  ReportAssessment,
} from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function fetchAiStatus() {
  const { data } = await apiClient.get<ApiEnvelope<AiStatus>>("/ai/status");
  return data.data;
}

export async function askHelp(question: string) {
  const { data } = await apiClient.post<ApiEnvelope<HelpAnswer>>("/ai/help/ask", { question });
  return data.data;
}

export async function askAboutProfessional(professionalId: string, question: string) {
  const { data } = await apiClient.post<ApiEnvelope<AiAnswer>>(
    `/ai/professionals/${professionalId}/ask`,
    { question },
  );
  return data.data;
}

export async function fetchProjectMatches(requestId: string) {
  const { data } = await apiClient.get<ApiEnvelope<MatchResult>>(
    `/ai/project-requests/${requestId}/matches`,
  );
  return data.data;
}

export async function askAboutChat(chatId: string, question?: string) {
  const { data } = await apiClient.post<ApiEnvelope<ChatAnswer>>(`/ai/chats/${chatId}/ask`, {
    question: question || undefined,
  });
  return data.data;
}

export async function draftQuotation(chatId: string, instructions?: string) {
  const { data } = await apiClient.post<ApiEnvelope<QuotationDraft>>(
    `/ai/chats/${chatId}/quotation-draft`,
    { instructions: instructions || undefined },
  );
  return data.data;
}

export async function fetchReportAssessment(reportId: string) {
  const { data } = await apiClient.get<ApiEnvelope<ReportAssessment>>(
    `/ai/admin/reports/${reportId}/assessment`,
  );
  return data.data;
}

export async function fetchDisputeAssessment(disputeId: string) {
  const { data } = await apiClient.get<ApiEnvelope<DisputeAssessment>>(
    `/ai/admin/disputes/${disputeId}/assessment`,
  );
  return data.data;
}
