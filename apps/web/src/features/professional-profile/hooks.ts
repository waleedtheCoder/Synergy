import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { fetchProfessionalProfile, updateProfessionalProfile } from "./api";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? fallback;
  }
  return fallback;
}

export function useProfessionalProfile() {
  return useQuery({
    queryKey: ["professional-profile", "me"],
    queryFn: fetchProfessionalProfile,
  });
}

export function useUpdateProfessionalProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfessionalProfile,
    onSuccess: () => {
      toast.success("Profile updated");
      void queryClient.invalidateQueries({ queryKey: ["professional-profile"] });
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Could not update profile"));
    },
  });
}
