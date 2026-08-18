import { z } from "zod";

export const professionalProfileSchema = z
  .object({
    businessName: z.string().max(150).optional(),
    tagline: z.string().max(150).optional(),
    about: z.string().max(3000).optional(),
    categoryId: z.string().optional(),
    yearsExperience: z.string().optional(),
    languages: z.string().optional(),
    responseTime: z.enum(["WITHIN_HOUR", "WITHIN_DAY", "WITHIN_WEEK"]).optional(),
    availability: z.enum(["AVAILABLE", "BUSY", "UNAVAILABLE"]),
    hourlyRateMin: z.string().optional(),
    hourlyRateMax: z.string().optional(),
    skillIds: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    const min = data.hourlyRateMin ? Number(data.hourlyRateMin) : undefined;
    const max = data.hourlyRateMax ? Number(data.hourlyRateMax) : undefined;

    if (data.hourlyRateMin && Number.isNaN(min)) {
      ctx.addIssue({ code: "custom", path: ["hourlyRateMin"], message: "Enter a valid number" });
    }
    if (data.hourlyRateMax && Number.isNaN(max)) {
      ctx.addIssue({ code: "custom", path: ["hourlyRateMax"], message: "Enter a valid number" });
    }
    if (min !== undefined && max !== undefined && !Number.isNaN(min) && !Number.isNaN(max) && min > max) {
      ctx.addIssue({
        code: "custom",
        path: ["hourlyRateMax"],
        message: "Minimum rate cannot exceed maximum rate",
      });
    }
    if (data.yearsExperience && Number.isNaN(Number(data.yearsExperience))) {
      ctx.addIssue({ code: "custom", path: ["yearsExperience"], message: "Enter a valid number" });
    }
  });

export type ProfessionalProfileInput = z.infer<typeof professionalProfileSchema>;

export interface UpdateProfessionalProfilePayload {
  businessName?: string;
  tagline?: string;
  about?: string;
  categoryId?: string;
  yearsExperience?: number;
  languages?: string[];
  responseTime?: string;
  availability?: string;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  skillIds?: string[];
}

export function toUpdateProfessionalProfilePayload(
  input: ProfessionalProfileInput,
): UpdateProfessionalProfilePayload {
  return {
    businessName: input.businessName || undefined,
    tagline: input.tagline || undefined,
    about: input.about || undefined,
    categoryId: input.categoryId || undefined,
    yearsExperience: input.yearsExperience ? Number(input.yearsExperience) : undefined,
    languages: input.languages
      ? input.languages
          .split(",")
          .map((language) => language.trim())
          .filter(Boolean)
      : undefined,
    responseTime: input.responseTime || undefined,
    availability: input.availability,
    hourlyRateMin: input.hourlyRateMin ? Number(input.hourlyRateMin) : undefined,
    hourlyRateMax: input.hourlyRateMax ? Number(input.hourlyRateMax) : undefined,
    skillIds: input.skillIds,
  };
}
