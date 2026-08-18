import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { createService, deleteService, fetchMyServices, updateService } from "./api";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? fallback;
  }
  return fallback;
}

export function useMyServices(params: { page?: number }) {
  return useQuery({
    queryKey: ["services", "me", params],
    queryFn: () => fetchMyServices(params),
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createService,
    onSuccess: () => {
      toast.success("Service created");
      void queryClient.invalidateQueries({ queryKey: ["services"] });
      void queryClient.invalidateQueries({ queryKey: ["professional-profile"] });
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Could not create the service"));
    },
  });
}

export function useUpdateService(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Parameters<typeof updateService>[1]) => updateService(id, input),
    onSuccess: () => {
      toast.success("Service updated");
      void queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Could not update the service"));
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      toast.success("Service deleted");
      void queryClient.invalidateQueries({ queryKey: ["services"] });
      void queryClient.invalidateQueries({ queryKey: ["professional-profile"] });
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Could not delete the service"));
    },
  });
}
