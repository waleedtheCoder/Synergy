import { apiClient } from "@/lib/api-client";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<ApiEnvelope<{ url: string }>>("/uploads", formData);
  return data.data;
}
