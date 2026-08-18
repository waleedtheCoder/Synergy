import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { createCertificate, deleteCertificate, fetchMyCertificates } from "./api";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? fallback;
  }
  return fallback;
}

export function useMyCertificates(params: { page?: number }) {
  return useQuery({
    queryKey: ["certificates", "me", params],
    queryFn: () => fetchMyCertificates(params),
  });
}

export function useCreateCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCertificate,
    onSuccess: () => {
      toast.success("Certificate added");
      void queryClient.invalidateQueries({ queryKey: ["certificates"] });
      void queryClient.invalidateQueries({ queryKey: ["professional-profile"] });
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Could not add the certificate"));
    },
  });
}

export function useDeleteCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCertificate,
    onSuccess: () => {
      toast.success("Certificate removed");
      void queryClient.invalidateQueries({ queryKey: ["certificates"] });
      void queryClient.invalidateQueries({ queryKey: ["professional-profile"] });
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Could not remove the certificate"));
    },
  });
}
