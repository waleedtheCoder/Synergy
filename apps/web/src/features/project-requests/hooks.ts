import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  cancelProjectRequest,
  createProjectRequest,
  fetchMyProjectRequests,
  fetchProjectRequest,
  updateProjectRequest,
} from "./api";
import type { ProjectRequestStatus } from "./types";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? fallback;
  }
  return fallback;
}

export function useMyProjectRequests(params: { page?: number; status?: ProjectRequestStatus }) {
  return useQuery({
    queryKey: ["project-requests", "me", params],
    queryFn: () => fetchMyProjectRequests(params),
  });
}

export function useProjectRequest(id: string) {
  return useQuery({
    queryKey: ["project-requests", id],
    queryFn: () => fetchProjectRequest(id),
    enabled: Boolean(id),
  });
}

export function useCreateProjectRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProjectRequest,
    onSuccess: () => {
      toast.success("Project request posted");
      void queryClient.invalidateQueries({ queryKey: ["project-requests", "me"] });
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Could not create the project request"));
    },
  });
}

export function useUpdateProjectRequest(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Parameters<typeof updateProjectRequest>[1]) =>
      updateProjectRequest(id, input),
    onSuccess: () => {
      toast.success("Project request updated");
      void queryClient.invalidateQueries({ queryKey: ["project-requests"] });
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Could not update the project request"));
    },
  });
}

export function useCancelProjectRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelProjectRequest,
    onSuccess: () => {
      toast.success("Project request cancelled");
      void queryClient.invalidateQueries({ queryKey: ["project-requests"] });
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Could not cancel the project request"));
    },
  });
}
