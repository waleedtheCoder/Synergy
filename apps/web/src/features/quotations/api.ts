import { apiClient } from "@/lib/api-client";
import type { Quotation } from "./types";
import type { QuotationPayload } from "./schemas";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function createQuotation(input: QuotationPayload) {
  const { data } = await apiClient.post<ApiEnvelope<Quotation>>("/quotations", input);
  return data.data;
}

export async function updateQuotationStatus(id: string, status: "ACCEPTED" | "REJECTED") {
  const { data } = await apiClient.patch<ApiEnvelope<Quotation>>(`/quotations/${id}/status`, {
    status,
  });
  return data.data;
}
