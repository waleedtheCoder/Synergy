import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phone: z.string().max(30).optional().or(z.literal("").transform(() => undefined)),
  address: z.string().max(255).optional().or(z.literal("").transform(() => undefined)),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
