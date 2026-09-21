import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node --transpile-only prisma/seed.ts',
  },
  datasource: {
    // CLI commands (migrate, db pull, studio) need a non-pooled connection;
    // the app itself connects via DATABASE_URL (pgbouncer) in PrismaService.
    url: env('DIRECT_URL'),
  },
});
