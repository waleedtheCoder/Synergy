import { z } from "zod";

export const certificateSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(150),
  issuer: z.string().max(150).optional(),
  issueDate: z.string().optional(),
  fileUrl: z.string().url("Enter a valid URL"),
});

export type CertificateInput = z.infer<typeof certificateSchema>;

export interface CertificatePayload {
  title: string;
  issuer?: string;
  issueDate?: string;
  fileUrl: string;
}

export function toCertificatePayload(input: CertificateInput): CertificatePayload {
  return {
    title: input.title,
    issuer: input.issuer || undefined,
    issueDate: input.issueDate || undefined,
    fileUrl: input.fileUrl,
  };
}
