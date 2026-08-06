import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:4000/api/v1"),
  NEXT_PUBLIC_WS_URL: z.string().url().default("http://localhost:4000"),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
});
