import { defineConfig } from 'drizzle-kit'

// Load .env.local for local development
import { config } from 'dotenv'
config({ path: '.env.local' })

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
})
