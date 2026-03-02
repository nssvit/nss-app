/**
 * Database Sync Script
 *
 * Syncs data from the active database to the standby database.
 * Uses pg_dump/pg_restore under the hood for a consistent snapshot.
 *
 * Usage:
 *   npx tsx scripts/sync-databases.ts [direction]
 *
 * Directions:
 *   supabase-to-neon  (default) — dump Supabase, restore to Neon
 *   neon-to-supabase            — dump Neon, restore to Supabase
 *
 * Prerequisites:
 *   - DIRECT_URL       (Supabase direct connection)
 *   - NEON_DIRECT_URL  (Neon direct connection)
 *   - pg_dump and pg_restore must be available in PATH
 */

import 'dotenv/config'
import { execSync } from 'child_process'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const SUPABASE_URL = process.env.DIRECT_URL
const NEON_URL = process.env.NEON_DIRECT_URL

if (!SUPABASE_URL) {
  console.error('DIRECT_URL environment variable is required')
  process.exit(1)
}
if (!NEON_URL) {
  console.error('NEON_DIRECT_URL environment variable is required')
  process.exit(1)
}

const direction = process.argv[2] ?? 'supabase-to-neon'
const validDirections = ['supabase-to-neon', 'neon-to-supabase']
if (!validDirections.includes(direction)) {
  console.error(`Invalid direction: ${direction}. Use one of: ${validDirections.join(', ')}`)
  process.exit(1)
}

const [sourceUrl, targetUrl, sourceName, targetName] =
  direction === 'supabase-to-neon'
    ? [SUPABASE_URL, NEON_URL, 'Supabase', 'Neon']
    : [NEON_URL, SUPABASE_URL, 'Neon', 'Supabase']

const tmpDir = mkdtempSync(join(tmpdir(), 'nss-sync-'))
const dumpFile = join(tmpDir, 'dump.sql')

try {
  console.log(`Syncing: ${sourceName} → ${targetName}`)
  console.log(`Temp directory: ${tmpDir}\n`)

  // Dump (data only, public schema, exclude Supabase-internal tables)
  console.log(`[1/3] Dumping ${sourceName}...`)
  execSync(
    `pg_dump "${sourceUrl}" --data-only --schema=public --no-owner --no-privileges --file="${dumpFile}"`,
    { stdio: 'inherit' }
  )

  // Clean target (truncate public tables)
  console.log(`\n[2/3] Cleaning ${targetName} public tables...`)
  execSync(
    `psql "${targetUrl}" -c "DO \\$\\$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' CASCADE'; END LOOP; END \\$\\$;"`,
    { stdio: 'inherit' }
  )

  // Restore
  console.log(`\n[3/3] Restoring to ${targetName}...`)
  execSync(
    `psql "${targetUrl}" -f "${dumpFile}"`,
    { stdio: 'inherit' }
  )

  console.log(`\nSync complete: ${sourceName} → ${targetName}`)
} catch (err) {
  console.error('\nSync failed:', err)
  process.exit(1)
} finally {
  // Cleanup
  rmSync(tmpDir, { recursive: true, force: true })
}
