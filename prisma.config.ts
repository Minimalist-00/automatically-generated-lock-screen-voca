import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    url: process.env.POSTGRES_PRISMA_URL || process.env.VERCEL_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL,
  },
});
