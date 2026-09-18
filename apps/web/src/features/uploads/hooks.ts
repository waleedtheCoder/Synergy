import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { uploadFile } from "./api";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? fallback;
  }
  return fallback;
}

export function useUploadFile() {
  return useMutation({
    mutationFn: uploadFile,
    onError: (error) => toast.error(errorMessage(error, "Could not upload the file")),
  });
}
