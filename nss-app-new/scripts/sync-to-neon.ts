/**
 * Sync data from Supabase → Neon
 *
 * Reads all rows from Supabase and upserts them into Neon.
 * Idempotent — safe to re-run. Uses ON CONFLICT DO NOTHING.
 *
 * Prerequisites:
 * - DIRECT_URL (Supabase) and NEON_DIRECT_URL must be set
 * - Run setup-neon.ts first to create tables on Neon
 * - Requires VPN if Supabase is blocked in your region
 *
 * Run: npx tsx scripts/sync-to-neon.ts
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import postgres from 'postgres'

const supabaseUrl = process.env.DIRECT_URL
const neonUrl = process.env.NEON_DIRECT_URL

if (!supabaseUrl) {
  console.error('DIRECT_URL (Supabase) environment variable is required')
  process.exit(1)
}
if (!neonUrl) {
  console.error('NEON_DIRECT_URL environment variable is required')
  process.exit(1)
}

const source = postgres(supabaseUrl, { prepare: false })
const target = postgres(neonUrl, { prepare: false })

// Tables in dependency order (parents before children)
const TABLES = [
  'volunteers',
  'role_definitions',
  'user_roles',
  'event_categories',
  'events',
  'event_participation',
  'audit_logs',
  // Better Auth tables
  'user',
  'account',
  'session',
  'verification',
] as const

async function getColumns(sql: postgres.Sql, table: string): Promise<string[]> {
  const rows = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${table}
    ORDER BY ordinal_position
  `
  return rows.map((r) => r.column_name as string)
}

async function syncTable(table: string) {
  const qt = `"${table}"` // quoted table name for raw SQL

  // Get row count from source
  const [{ count: sourceCount }] = await source.unsafe<{ count: number }[]>(`SELECT count(*)::int as count FROM ${qt}`)

  if (sourceCount === 0) {
    console.log(`   ⏭  ${table}: empty, skipping`)
    return { table, synced: 0, skipped: 0, total: 0 }
  }

  // Get columns from source
  const columns = await getColumns(source, table)
  const colList = columns.map((c) => `"${c}"`).join(', ')

  // Read all rows from source — use ctid ordering as fallback for tables without created_at
  const hasCreatedAt = columns.includes('created_at')
  const orderClause = hasCreatedAt ? 'ORDER BY created_at ASC' : ''
  const rows = await source.unsafe(`SELECT ${colList} FROM ${qt} ${orderClause}`)

  // Get primary key column
  const pkResult = await source.unsafe(`
    SELECT a.attname
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = 'public.${table}'::regclass AND i.indisprimary
  `)
  const pkCol = pkResult[0]?.attname ?? 'id'

  let synced = 0
  let skipped = 0

  // Batch insert (100 rows at a time)
  const batchSize = 100
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)

    for (const row of batch) {
      try {
        const values = columns.map((c) => row[c])
        const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ')

        await target.unsafe(
          `INSERT INTO ${qt} (${colList}) VALUES (${placeholders}) ON CONFLICT ("${pkCol}") DO NOTHING`,
          values
        )
        synced++
      } catch (err) {
        skipped++
        if (skipped <= 3) {
          console.error(`   ⚠  ${table} row error:`, (err as Error).message?.slice(0, 100))
        }
      }
    }

    // Progress for large tables
    if (rows.length > batchSize) {
      const pct = Math.min(100, Math.round(((i + batchSize) / rows.length) * 100))
      process.stdout.write(`\r   📦 ${table}: ${pct}%`)
    }
  }

  if (rows.length > batchSize) process.stdout.write('\r')
  console.log(`   ✅ ${table}: ${synced} synced, ${skipped} skipped (of ${sourceCount} total)`)

  return { table, synced, skipped, total: sourceCount }
}

async function fixSequences() {
  // Fix serial sequences (event_categories has SERIAL id)
  console.log('\n🔧 Fixing sequences...')
  try {
    await target`SELECT setval('event_categories_id_seq', COALESCE((SELECT MAX(id) FROM event_categories), 0) + 1, false)`
    console.log('   ✅ event_categories_id_seq fixed')
  } catch {
    console.log('   ⏭  No sequence to fix')
  }
}

async function main() {
  console.log('🔄 Syncing data: Supabase → Neon\n')

  // Test connections
  try {
    await source`SELECT 1`
    console.log('✅ Connected to Supabase')
  } catch (err) {
    console.error('❌ Cannot connect to Supabase (VPN needed?):', (err as Error).message)
    process.exit(1)
  }

  try {
    await target`SELECT 1`
    console.log('✅ Connected to Neon\n')
  } catch (err) {
    console.error('❌ Cannot connect to Neon:', (err as Error).message)
    process.exit(1)
  }

  // Check if tables exist on Neon
  const neonTables = await target`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `
  const neonTableNames = new Set(neonTables.map((t) => t.tablename))

  if (!neonTableNames.has('volunteers')) {
    console.error('❌ Tables not found on Neon. Run setup-neon.ts first:')
    console.error('   npx tsx scripts/setup-neon.ts')
    process.exit(1)
  }

  console.log('📊 Syncing tables...\n')
  const results = []

  for (const table of TABLES) {
    if (!neonTableNames.has(table)) {
      console.log(`   ⏭  ${table}: table not found on Neon, skipping`)
      continue
    }
    const result = await syncTable(table)
    results.push(result)
  }

  await fixSequences()

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Sync Summary:')
  const totalSynced = results.reduce((sum, r) => sum + r.synced, 0)
  const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0)
  console.log(`   Total synced:  ${totalSynced} rows`)
  console.log(`   Total skipped: ${totalSkipped} rows`)
  console.log('='.repeat(50))

  await source.end()
  await target.end()
}

main().catch((err) => {
  console.error('❌ Sync failed:', err)
  process.exit(1)
})
