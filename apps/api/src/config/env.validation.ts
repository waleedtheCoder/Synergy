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

  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // 32-byte (64 hex char) key used to encrypt sensitive fields at rest
  // (currently: 2FA TOTP secrets). Generate with: openssl rand -hex 32
  ENCRYPTION_KEY: z
    .string()
    .length(64, 'must be a 64-char hex string (32 bytes)'),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Synergi <hello@synergi.dev>'),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),

  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_STORAGE_BUCKET: z.string().default('uploads'),

  MEILISEARCH_HOST: z.string().optional(),
  MEILISEARCH_API_KEY: z.string().optional(),

  SENTRY_DSN: z.string().optional(),

  // Unset disables CAPTCHA verification entirely (see TurnstileService) —
  // useful for local dev/CI where no Cloudflare account is configured.
  TURNSTILE_SECRET_KEY: z.string().optional(),

  // Unset disables the AI/RAG endpoints (they return 503); embeddings are
  // computed locally and keep indexing either way.
  ANTHROPIC_API_KEY: z.string().optional(),

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
