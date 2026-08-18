import { z } from "zod";

export const meetingSchema = z.object({
  scheduledAt: z.string().min(1, "Pick a date and time"),
  durationMins: z.string().optional(),
  location: z.string().max(255).optional(),
  meetingLink: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export type MeetingInput = z.infer<typeof meetingSchema>;

export interface MeetingPayload {
  chatId: string;
  scheduledAt: string;
  durationMins?: number;
  location?: string;
  meetingLink?: string;
  notes?: string;
}

export function toMeetingPayload(chatId: string, input: MeetingInput): MeetingPayload {
  return {
    chatId,
    scheduledAt: new Date(input.scheduledAt).toISOString(),
    durationMins: input.durationMins ? Number(input.durationMins) : undefined,
    location: input.location || undefined,
    meetingLink: input.meetingLink || undefined,
    notes: input.notes || undefined,
  };
}
