import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { createQuotation, updateQuotationStatus } from "./api";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? fallback;
  }
  return fallback;
}

export function useCreateQuotation() {
  return useMutation({
    mutationFn: createQuotation,
    onSuccess: () => {
      toast.success("Quotation sent");
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Could not send the quotation"));
    },
  });
}

export function useUpdateQuotationStatus() {
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACCEPTED" | "REJECTED" }) =>
      updateQuotationStatus(id, status),
    onSuccess: (_, variables) => {
      toast.success(variables.status === "ACCEPTED" ? "Quotation accepted" : "Quotation rejected");
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Could not update the quotation"));
    },
  });
}
