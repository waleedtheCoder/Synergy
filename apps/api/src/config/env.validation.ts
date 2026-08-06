import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(4000),
  API_PREFIX: z.string().default('api/v1'),
  APP_URL: z.url(),
  WEB_URL: z.url(),
  COOKIE_SECRET: z.string().min(1),

  DATABASE_URL: z.string().min(1),

  REDIS_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Synergi <hello@synergi.dev>'),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),

  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),

  MEILISEARCH_HOST: z.string().optional(),
  MEILISEARCH_API_KEY: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  GOOGLE_MAPS_API_KEY: z.string().optional(),

  THROTTLE_TTL: z.coerce.number().default(60000),
  THROTTLE_LIMIT: z.coerce.number().default(100),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${formatted}`);
  }

  return parsed.data;
}
