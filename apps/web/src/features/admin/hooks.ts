import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import type {
  Role,
  UserStatus,
  ReportStatus,
  DisputeStatus,
  CampaignStatus,
  PaymentStatus,
  PaymentType,
} from "@synergi/shared-types";
import * as api from "./api";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? fallback;
  }
  return fallback;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: api.fetchAdminStats,
  });
}

export function useAdminUsers(params: {
  page?: number;
  role?: Role;
  status?: UserStatus;
  search?: string;
}) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => api.fetchAdminUsers(params),
  });
}

export function useAdminUser(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "users", "detail", id],
    queryFn: () => api.fetchAdminUser(id!),
    enabled: !!id,
  });
}

export function useUpdateAdminUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      api.updateAdminUserStatus(id, status),
    onSuccess: () => {
      toast.success("User status updated");
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Could not update user status")),
  });
}

export function useAdminProfessionals(params: {
  page?: number;
  verified?: boolean;
  search?: string;
}) {
  return useQuery({
    queryKey: ["admin", "professionals", params],
    queryFn: () => api.fetchAdminProfessionals(params),
  });
}

export function useSetProfessionalVerified() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
      api.setProfessionalVerified(id, verified),
    onSuccess: () => {
      toast.success("Professional verification updated");
      void queryClient.invalidateQueries({ queryKey: ["admin", "professionals"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Could not update verification")),
  });
}

export function useAdminCertificates(params: { page?: number; verified?: boolean }) {
  return useQuery({
    queryKey: ["admin", "certificates", params],
    queryFn: () => api.fetchAdminCertificates(params),
  });
}

export function useSetCertificateVerified() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
      api.setCertificateVerified(id, verified),
    onSuccess: () => {
      toast.success("Certificate verification updated");
      void queryClient.invalidateQueries({ queryKey: ["admin", "certificates"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Could not update verification")),
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: api.fetchAdminCategories,
  });
}

export function useCreateAdminCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createAdminCategory,
    onSuccess: () => {
      toast.success("Category created");
      void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Could not create category")),
  });
}

export function useUpdateAdminCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { name?: string; icon?: string; parentId?: string };
    }) => api.updateAdminCategory(id, input),
    onSuccess: () => {
      toast.success("Category updated");
      void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Could not update category")),
  });
}

export function useDeleteAdminCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteAdminCategory,
    onSuccess: () => {
      toast.success("Category deleted");
      void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Could not delete category")),
  });
}

export function useAdminSkills() {
  return useQuery({
    queryKey: ["admin", "skills"],
    queryFn: api.fetchAdminSkills,
  });
}

export function useCreateAdminSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createAdminSkill,
    onSuccess: () => {
      toast.success("Skill created");
      void queryClient.invalidateQueries({ queryKey: ["admin", "skills"] });
      void queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Could not create skill")),
  });
}

export function useDeleteAdminSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteAdminSkill,
    onSuccess: () => {
      toast.success("Skill deleted");
      void queryClient.invalidateQueries({ queryKey: ["admin", "skills"] });
      void queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Could not delete skill")),
  });
}

export function useAdminReports(params: { page?: number; status?: ReportStatus }) {
  return useQuery({
    queryKey: ["admin", "reports", params],
    queryFn: () => api.fetchAdminReports(params),
  });
}

export function useResolveAdminReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReportStatus }) =>
      api.resolveAdminReport(id, status),
    onSuccess: () => {
      toast.success("Report updated");
      void queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Could not update report")),
  });
}

export function useAdminDisputes(params: { page?: number; status?: DisputeStatus }) {
  return useQuery({
    queryKey: ["admin", "disputes", params],
    queryFn: () => api.fetchAdminDisputes(params),
  });
}

export function useResolveAdminDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { status: DisputeStatus; resolution?: string };
    }) => api.resolveAdminDispute(id, input),
    onSuccess: () => {
      toast.success("Dispute updated");
      void queryClient.invalidateQueries({ queryKey: ["admin", "disputes"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Could not update dispute")),
  });
}

export function useAdminCampaigns(params: { page?: number; status?: CampaignStatus }) {
  return useQuery({
    queryKey: ["admin", "campaigns", params],
    queryFn: () => api.fetchAdminCampaigns(params),
  });
}

export function useUpdateAdminCampaignStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CampaignStatus }) =>
      api.updateAdminCampaignStatus(id, status),
    onSuccess: () => {
      toast.success("Campaign updated");
      void queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Could not update campaign")),
  });
}

export function useAdminPayments(params: {
  page?: number;
  status?: PaymentStatus;
  type?: PaymentType;
}) {
  return useQuery({
    queryKey: ["admin", "payments", params],
    queryFn: () => api.fetchAdminPayments(params),
  });
}

export function useConfirmAdminPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.confirmAdminPayment,
    onSuccess: () => {
      toast.success("Payment confirmed");
      void queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Could not confirm payment")),
  });
}

export function useRejectAdminPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.rejectAdminPayment,
    onSuccess: () => {
      toast.success("Payment rejected");
      void queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Could not reject payment")),
  });
}
