import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import type { MeetingStatus } from "@/features/chats/types";
import { createMeeting, updateMeetingStatus } from "./api";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? fallback;
  }
  return fallback;
}

export function useCreateMeeting() {
  return useMutation({
    mutationFn: createMeeting,
    onSuccess: () => {
      toast.success("Meeting proposed");
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Could not propose the meeting"));
    },
  });
}

export function useUpdateMeetingStatus() {
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MeetingStatus }) =>
      updateMeetingStatus(id, status),
    onSuccess: () => {
      toast.success("Meeting updated");
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Could not update the meeting"));
    },
  });
}
