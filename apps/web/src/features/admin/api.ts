import { apiClient } from "@/lib/api-client";
import type { PaginatedResult } from "@/lib/pagination";
import type {
  Role,
  UserStatus,
  ReportStatus,
  DisputeStatus,
  CampaignStatus,
  PaymentStatus,
  PaymentType,
} from "@synergi/shared-types";
import type {
  AdminStats,
  AdminUser,
  AdminUserDetail,
  AdminProfessional,
  AdminCertificate,
  AdminCategory,
  AdminSkill,
  AdminReport,
  AdminDispute,
  AdminCampaign,
  AdminPayment,
} from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function fetchAdminStats() {
  const { data } = await apiClient.get<ApiEnvelope<AdminStats>>("/admin/stats");
  return data.data;
}

export async function fetchAdminUsers(params: {
  page?: number;
  role?: Role;
  status?: UserStatus;
  search?: string;
}) {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<AdminUser>>>("/admin/users", {
    params,
  });
  return data.data;
}

export async function fetchAdminUser(id: string) {
  const { data } = await apiClient.get<ApiEnvelope<AdminUserDetail>>(`/admin/users/${id}`);
  return data.data;
}

export async function updateAdminUserStatus(id: string, status: UserStatus) {
  const { data } = await apiClient.patch<ApiEnvelope<AdminUser>>(`/admin/users/${id}/status`, {
    status,
  });
  return data.data;
}

export async function fetchAdminProfessionals(params: {
  page?: number;
  verified?: boolean;
  search?: string;
}) {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<AdminProfessional>>>(
    "/admin/verification/professionals",
    { params },
  );
  return data.data;
}

export async function setProfessionalVerified(id: string, verified: boolean) {
  const { data } = await apiClient.patch<ApiEnvelope<AdminProfessional>>(
    `/admin/verification/professionals/${id}`,
    { verified },
  );
  return data.data;
}

export async function fetchAdminCertificates(params: { page?: number; verified?: boolean }) {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<AdminCertificate>>>(
    "/admin/verification/certificates",
    { params },
  );
  return data.data;
}

export async function setCertificateVerified(id: string, verified: boolean) {
  const { data } = await apiClient.patch<ApiEnvelope<AdminCertificate>>(
    `/admin/verification/certificates/${id}`,
    { verified },
  );
  return data.data;
}

export async function fetchAdminCategories() {
  const { data } = await apiClient.get<ApiEnvelope<AdminCategory[]>>("/categories");
  return data.data;
}

export async function createAdminCategory(input: { name: string; icon?: string; parentId?: string }) {
  const { data } = await apiClient.post<ApiEnvelope<AdminCategory>>("/admin/categories", input);
  return data.data;
}

export async function updateAdminCategory(
  id: string,
  input: { name?: string; icon?: string; parentId?: string },
) {
  const { data } = await apiClient.patch<ApiEnvelope<AdminCategory>>(
    `/admin/categories/${id}`,
    input,
  );
  return data.data;
}

export async function deleteAdminCategory(id: string) {
  await apiClient.delete<ApiEnvelope<null>>(`/admin/categories/${id}`);
}

export async function fetchAdminSkills() {
  const { data } = await apiClient.get<ApiEnvelope<AdminSkill[]>>("/skills");
  return data.data;
}

export async function createAdminSkill(name: string) {
  const { data } = await apiClient.post<ApiEnvelope<AdminSkill>>("/admin/skills", { name });
  return data.data;
}

export async function deleteAdminSkill(id: string) {
  await apiClient.delete<ApiEnvelope<null>>(`/admin/skills/${id}`);
}

export async function fetchAdminReports(params: { page?: number; status?: ReportStatus }) {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<AdminReport>>>(
    "/admin/reports",
    { params },
  );
  return data.data;
}

export async function resolveAdminReport(id: string, status: ReportStatus) {
  const { data } = await apiClient.patch<ApiEnvelope<AdminReport>>(`/admin/reports/${id}`, {
    status,
  });
  return data.data;
}

export async function fetchAdminDisputes(params: { page?: number; status?: DisputeStatus }) {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<AdminDispute>>>(
    "/admin/disputes",
    { params },
  );
  return data.data;
}

export async function resolveAdminDispute(
  id: string,
  input: { status: DisputeStatus; resolution?: string },
) {
  const { data } = await apiClient.patch<ApiEnvelope<AdminDispute>>(
    `/admin/disputes/${id}`,
    input,
  );
  return data.data;
}

export async function fetchAdminCampaigns(params: { page?: number; status?: CampaignStatus }) {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<AdminCampaign>>>(
    "/admin/campaigns",
    { params },
  );
  return data.data;
}

export async function updateAdminCampaignStatus(id: string, status: CampaignStatus) {
  const { data } = await apiClient.patch<ApiEnvelope<AdminCampaign>>(
    `/admin/campaigns/${id}/status`,
    { status },
  );
  return data.data;
}

export async function fetchAdminPayments(params: {
  page?: number;
  status?: PaymentStatus;
  type?: PaymentType;
}) {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<AdminPayment>>>(
    "/admin/payments",
    { params },
  );
  return data.data;
}

export async function confirmAdminPayment(id: string) {
  const { data } = await apiClient.patch<ApiEnvelope<AdminPayment>>(
    `/admin/payments/${id}/confirm`,
  );
  return data.data;
}

export async function rejectAdminPayment(id: string) {
  const { data } = await apiClient.patch<ApiEnvelope<AdminPayment>>(
    `/admin/payments/${id}/reject`,
  );
  return data.data;
}
