import { z } from "zod";

export const serviceSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters").max(150),
    description: z.string().max(2000).optional(),
    categoryId: z.string().optional(),
    priceType: z.enum(["FIXED", "HOURLY", "QUOTE"]),
    price: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const min = data.minPrice ? Number(data.minPrice) : undefined;
    const max = data.maxPrice ? Number(data.maxPrice) : undefined;

    if (data.price && Number.isNaN(Number(data.price))) {
      ctx.addIssue({ code: "custom", path: ["price"], message: "Enter a valid number" });
    }
    if (data.minPrice && Number.isNaN(min)) {
      ctx.addIssue({ code: "custom", path: ["minPrice"], message: "Enter a valid number" });
    }
    if (data.maxPrice && Number.isNaN(max)) {
      ctx.addIssue({ code: "custom", path: ["maxPrice"], message: "Enter a valid number" });
    }
    if (min !== undefined && max !== undefined && !Number.isNaN(min) && !Number.isNaN(max) && min > max) {
      ctx.addIssue({ code: "custom", path: ["maxPrice"], message: "Minimum price cannot exceed maximum price" });
    }
  });

export type ServiceInput = z.infer<typeof serviceSchema>;

export interface ServicePayload {
  title: string;
  description?: string;
  categoryId?: string;
  priceType: string;
  price?: number;
  minPrice?: number;
  maxPrice?: number;
}

export function toServicePayload(input: ServiceInput): ServicePayload {
  return {
    title: input.title,
    description: input.description || undefined,
    categoryId: input.categoryId || undefined,
    priceType: input.priceType,
    price: input.price ? Number(input.price) : undefined,
    minPrice: input.minPrice ? Number(input.minPrice) : undefined,
    maxPrice: input.maxPrice ? Number(input.maxPrice) : undefined,
  };
}
