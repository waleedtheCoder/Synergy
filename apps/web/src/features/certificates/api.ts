import { apiClient } from "@/lib/api-client";
import type { PaginatedResult } from "@/lib/pagination";
import type { Certificate } from "./types";
import type { CertificatePayload } from "./schemas";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function fetchMyCertificates(params: { page?: number }) {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<Certificate>>>(
    "/certificates/me",
    { params },
  );
  return data.data;
}

export async function createCertificate(input: CertificatePayload) {
  const { data } = await apiClient.post<ApiEnvelope<Certificate>>("/certificates", input);
  return data.data;
}

export async function deleteCertificate(id: string) {
  await apiClient.delete<ApiEnvelope<null>>(`/certificates/${id}`);
}
