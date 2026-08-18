import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  createPortfolioProject,
  deletePortfolioProject,
  fetchMyPortfolioProjects,
  updatePortfolioProject,
} from "./api";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? fallback;
  }
  return fallback;
}

export function useMyPortfolioProjects(params: { page?: number }) {
  return useQuery({
    queryKey: ["portfolio-projects", "me", params],
    queryFn: () => fetchMyPortfolioProjects(params),
  });
}

export function useCreatePortfolioProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPortfolioProject,
    onSuccess: () => {
      toast.success("Portfolio project added");
      void queryClient.invalidateQueries({ queryKey: ["portfolio-projects"] });
      void queryClient.invalidateQueries({ queryKey: ["professional-profile"] });
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Could not add the portfolio project"));
    },
  });
}

export function useUpdatePortfolioProject(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Parameters<typeof updatePortfolioProject>[1]) =>
      updatePortfolioProject(id, input),
    onSuccess: () => {
      toast.success("Portfolio project updated");
      void queryClient.invalidateQueries({ queryKey: ["portfolio-projects"] });
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Could not update the portfolio project"));
    },
  });
}

export function useDeletePortfolioProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePortfolioProject,
    onSuccess: () => {
      toast.success("Portfolio project deleted");
      void queryClient.invalidateQueries({ queryKey: ["portfolio-projects"] });
      void queryClient.invalidateQueries({ queryKey: ["professional-profile"] });
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Could not delete the portfolio project"));
    },
  });
}
