import { config as loadEnv } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// The Prisma CLI does not load env files on its own (and Next.js only loads
// them at app runtime), so the config pulls them in here. This replaces the
// old dotenv-cli-wrapped npm scripts. .env.local wins; .env is the fallback;
// on Vercel neither file exists and process.env is already populated.
loadEnv({ path: '.env.local' });
loadEnv();

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        seed: 'ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
    },
    datasource: {
        url: env('DATABASE_URL'),
    },
});
