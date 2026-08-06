import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(
    /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number",
  );

export const registerSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: passwordSchema,
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  role: z.enum(["CLIENT", "PROFESSIONAL"], {
    message: "Choose how you plan to use Synergi",
  }),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const resetPasswordFormSchema = resetPasswordSchema
  .extend({ confirmPassword: z.string().min(1, "Confirm your password") })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordFormInput = z.infer<typeof resetPasswordFormSchema>;
