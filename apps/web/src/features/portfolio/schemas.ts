import { z } from "zod";

export const portfolioProjectSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters").max(150),
    description: z.string().max(3000).optional(),
    categoryId: z.string().optional(),
    location: z.string().max(255).optional(),
    budgetMin: z.string().optional(),
    budgetMax: z.string().optional(),
    completedAt: z.string().optional(),
    published: z.boolean(),
    images: z.array(
      z.object({
        url: z.string().url("Enter a valid image URL"),
        caption: z.string().max(255).optional(),
      }),
    ),
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
      ctx.addIssue({ code: "custom", path: ["budgetMax"], message: "Minimum budget cannot exceed maximum budget" });
    }
  });

export type PortfolioProjectInput = z.infer<typeof portfolioProjectSchema>;

export interface PortfolioProjectPayload {
  title: string;
  description?: string;
  categoryId?: string;
  location?: string;
  budgetMin?: number;
  budgetMax?: number;
  completedAt?: string;
  published: boolean;
  images: { url: string; caption?: string; order: number }[];
}

export function toPortfolioProjectPayload(input: PortfolioProjectInput): PortfolioProjectPayload {
  return {
    title: input.title,
    description: input.description || undefined,
    categoryId: input.categoryId || undefined,
    location: input.location || undefined,
    budgetMin: input.budgetMin ? Number(input.budgetMin) : undefined,
    budgetMax: input.budgetMax ? Number(input.budgetMax) : undefined,
    completedAt: input.completedAt || undefined,
    published: input.published,
    images: input.images.map((image, index) => ({
      url: image.url,
      caption: image.caption || undefined,
      order: index,
    })),
  };
}
