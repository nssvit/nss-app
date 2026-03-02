/**
 * Database Migration Runner
 *
 * Applies ONLY new migrations that haven't been run yet.
 * Tracks applied migrations in a `_migrations` table.
 *
 * Usage:
 *   npm run db:migrate          — apply pending migrations
 *   npm run db:migrate:status   — show migration status
 *
 * How it works:
 *   1. Creates `_migrations` table if it doesn't exist
 *   2. Reads all SQL files in src/db/migrations/ (excluding 0000_*)
 *   3. Skips files already recorded in `_migrations`
 *   4. Runs new files in order, records them on success
 *
 * For schema changes (tables/columns/indexes):
 *   1. Edit Drizzle schema files in src/db/schema/
 *   2. Run: npm run db:generate  (creates migration SQL)
 *   3. Run: npm run db:migrate   (applies it)
 *
 * For custom SQL (triggers/RLS/functions/seeds):
 *   1. Create a new file: src/db/migrations/NNNN_description.sql
 *   2. Run: npm run db:migrate
 */

import 'dotenv/config'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'
import postgres from 'postgres'
import { resolveDatabaseUrl } from './resolve-url'

config({ path: '.env.local' })

const MIGRATIONS_DIR = join(__dirname, 'migrations')

async function ensureMigrationsTable(client: postgres.Sql) {
  await client`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `
}

async function getAppliedMigrations(client: postgres.Sql): Promise<Set<string>> {
  const rows = await client`SELECT filename FROM _migrations ORDER BY filename`
  return new Set(rows.map((r) => r.filename))
}

function getMigrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql') && !f.startsWith('0000'))
    .sort()
}

async function migrate() {
  const statusOnly = process.argv.includes('--status')

  console.log('📦 NSS App Database Migration\n')

  const client = postgres(resolveDatabaseUrl(), { max: 1 })

  try {
    await ensureMigrationsTable(client)

    const applied = await getAppliedMigrations(client)
    const allFiles = await getMigrationFiles()

    // Status mode — just show what's applied and what's pending
    if (statusOnly) {
      console.log('Migration Status:\n')
      for (const file of allFiles) {
        const status = applied.has(file) ? '✅ applied' : '⏳ pending'
        console.log(`  ${status}  ${file}`)
      }
      const pending = allFiles.filter((f) => !applied.has(f))
      console.log(`\n  Total: ${allFiles.length} | Applied: ${applied.size} | Pending: ${pending.length}`)
      return
    }

    // Find pending migrations
    const pending = allFiles.filter((f) => !applied.has(f))

    if (pending.length === 0) {
      console.log('✅ All migrations are up to date. Nothing to run.')
      return
    }

    console.log(`Found ${pending.length} pending migration(s):\n`)
    pending.forEach((f) => console.log(`  ⏳ ${f}`))
    console.log('')

    // Apply each pending migration in order
    for (const file of pending) {
      const filePath = join(MIGRATIONS_DIR, file)
      const sqlContent = readFileSync(filePath, 'utf-8')

      console.log(`▶ Running ${file}...`)

      try {
        // Run migration in a transaction where possible
        await client.unsafe(sqlContent)

        // Record successful migration
        await client`INSERT INTO _migrations (filename) VALUES (${file})`

        console.log(`  ✅ ${file} applied successfully`)
      } catch (error: unknown) {
        const pgError = error as { severity?: string; message?: string }
        if (pgError.severity === 'NOTICE') {
          console.log(`  ⚠️  Notice: ${pgError.message}`)
          // Still record it as applied
          await client`INSERT INTO _migrations (filename) VALUES (${file})`
        } else {
          console.error(`  ❌ FAILED: ${file}`)
          console.error(`     Error: ${pgError.message}`)
          console.error(`\n  Migration stopped. Fix the error and re-run.`)
          console.error(`  Successfully applied migrations before this one are recorded.`)
          throw error
        }
      }
    }

    console.log(`\n✅ All ${pending.length} migration(s) applied successfully.`)
  } catch (error) {
    // Only re-throw if it's not already handled above
    if (!(error instanceof Error && error.message.includes('FAILED'))) {
      console.error('\n❌ Migration failed:', error)
    }
    process.exit(1)
  } finally {
    await client.end()
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
