import { z } from "zod";

export const quotationSchema = z.object({
  notes: z.string().max(2000).optional(),
  validUntil: z.string().optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(1, "Required").max(255),
        quantity: z.string().optional(),
        unitPrice: z.string().min(1, "Required"),
      }),
    )
    .min(1, "Add at least one item"),
});

export type QuotationInput = z.infer<typeof quotationSchema>;

export interface QuotationPayload {
  chatId: string;
  projectRequestId?: string;
  notes?: string;
  validUntil?: string;
  items: { description: string; quantity?: number; unitPrice: number }[];
}

export function toQuotationPayload(
  chatId: string,
  input: QuotationInput,
  projectRequestId?: string,
): QuotationPayload {
  return {
    chatId,
    projectRequestId,
    notes: input.notes || undefined,
    validUntil: input.validUntil || undefined,
    items: input.items.map((item) => ({
      description: item.description,
      quantity: item.quantity ? Number(item.quantity) : undefined,
      unitPrice: Number(item.unitPrice),
    })),
  };
}
