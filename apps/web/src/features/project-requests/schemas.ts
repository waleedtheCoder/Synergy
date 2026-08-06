import { z } from "zod";

export const projectRequestSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters").max(150),
    description: z.string().min(10, "Description must be at least 10 characters").max(5000),
    budgetMin: z.string().optional(),
    budgetMax: z.string().optional(),
    timeline: z.string().max(100).optional(),
    categoryId: z.string().optional(),
    address: z.string().max(255).optional(),
  })
  .superRefine((data, ctx) => {
    const min = data.budgetMin ? Number(data.budgetMin) : undefined;
    const max = data.budgetMax ? Number(data.budgetMax) : undefined;

    if (data.budgetMin && Number.isNaN(min)) {
      ctx.addIssue({ code: "custom", path: ["budgetMin"], message: "Enter a valid number" });
    }
    if (data.budgetMax && Number.isNaN(max)) {
      ctx.addIssue({ code: "custom", path: ["budgetMax"], message: "Enter a valid number" });
    }
    if (min !== undefined && max !== undefined && !Number.isNaN(min) && !Number.isNaN(max) && min > max) {
      ctx.addIssue({
        code: "custom",
        path: ["budgetMax"],
        message: "Minimum budget cannot exceed maximum budget",
      });
    }
  });

export type ProjectRequestInput = z.infer<typeof projectRequestSchema>;

export interface CreateProjectRequestPayload {
  title: string;
  description: string;
  budgetMin?: number;
  budgetMax?: number;
  timeline?: string;
  categoryId?: string;
  address?: string;
}

export function toCreateProjectRequestPayload(
  input: ProjectRequestInput,
): CreateProjectRequestPayload {
  return {
    title: input.title,
    description: input.description,
    budgetMin: input.budgetMin ? Number(input.budgetMin) : undefined,
    budgetMax: input.budgetMax ? Number(input.budgetMax) : undefined,
    timeline: input.timeline || undefined,
    categoryId: input.categoryId || undefined,
    address: input.address || undefined,
  };
}
