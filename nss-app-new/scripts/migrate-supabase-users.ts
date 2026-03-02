/**
 * One-time migration script: Supabase Auth → Better Auth
 *
 * Migrates users from Supabase's auth.users table into Better Auth's
 * user + account tables, preserving UUIDs and bcrypt password hashes.
 *
 * Prerequisites:
 * - DIRECT_URL env var set (Supabase direct connection, bypasses pooler)
 * - Better Auth tables (user, account) must already exist (run migration 0007 first)
 * - Run from project root: npx tsx scripts/migrate-supabase-users.ts
 *
 * This script is idempotent — re-running it skips already-migrated users.
 */

import 'dotenv/config'
import postgres from 'postgres'

const directUrl = process.env.DIRECT_URL
if (!directUrl) {
  console.error('DIRECT_URL environment variable is required')
  process.exit(1)
}

const sql = postgres(directUrl, { prepare: false })

interface SupabaseUser {
  id: string
  email: string
  raw_user_meta_data: Record<string, unknown>
  created_at: string
  updated_at: string
  email_confirmed_at: string | null
}

interface SupabaseIdentity {
  user_id: string
  provider_id: string
  identity_data: Record<string, unknown>
}

async function main() {
  console.log('Starting Supabase Auth → Better Auth migration...\n')

  // 1. Fetch all users from Supabase auth schema
  const users = await sql<SupabaseUser[]>`
    SELECT id, email, raw_user_meta_data, created_at, updated_at, email_confirmed_at
    FROM auth.users
    ORDER BY created_at ASC
  `
  console.log(`Found ${users.length} users in auth.users`)

  // 2. Fetch identities (contains password hashes for email provider)
  const identities = await sql<SupabaseIdentity[]>`
    SELECT user_id, provider_id, identity_data
    FROM auth.identities
    WHERE provider = 'email'
  `
  const identityMap = new Map(identities.map((i) => [i.user_id, i]))
  console.log(`Found ${identities.length} email identities\n`)

  // 3. Fetch existing Better Auth users to skip duplicates
  const existingUsers = await sql<{ id: string }[]>`SELECT id FROM "user"`
  const existingIds = new Set(existingUsers.map((u) => u.id))

  let migrated = 0
  let skipped = 0
  let errors = 0

  for (const user of users) {
    if (existingIds.has(user.id)) {
      skipped++
      continue
    }

    try {
      const meta = user.raw_user_meta_data ?? {}
      const name = [meta.first_name, meta.last_name].filter(Boolean).join(' ') || user.email.split('@')[0]
      const emailVerified = !!user.email_confirmed_at

      // Insert into Better Auth user table (preserve UUID)
      await sql`
        INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
        VALUES (
          ${user.id},
          ${name},
          ${user.email},
          ${emailVerified},
          ${user.created_at}::timestamptz,
          ${user.updated_at}::timestamptz
        )
        ON CONFLICT (id) DO NOTHING
      `

      // Insert account with password hash from Supabase
      // Supabase stores bcrypt hash in auth.users.encrypted_password
      const passwordHash = await sql<{ encrypted_password: string }[]>`
        SELECT encrypted_password FROM auth.users WHERE id = ${user.id}
      `
      const hash = passwordHash[0]?.encrypted_password ?? null

      const accountId = `ba_${user.id.replace(/-/g, '').slice(0, 24)}`
      await sql`
        INSERT INTO "account" (id, user_id, account_id, provider_id, password, created_at, updated_at)
        VALUES (
          ${accountId},
          ${user.id},
          ${user.id},
          ${'credential'},
          ${hash},
          ${user.created_at}::timestamptz,
          ${user.updated_at}::timestamptz
        )
        ON CONFLICT (id) DO NOTHING
      `

      migrated++
    } catch (err) {
      errors++
      console.error(`Failed to migrate user ${user.id} (${user.email}):`, err)
    }
  }

  console.log(`\nMigration complete:`)
  console.log(`  Migrated: ${migrated}`)
  console.log(`  Skipped (already exist): ${skipped}`)
  console.log(`  Errors: ${errors}`)

  // 4. Verify volunteers.auth_user_id alignment
  const mismatches = await sql`
    SELECT v.id, v.auth_user_id, v.email
    FROM volunteers v
    WHERE v.auth_user_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM "user" u WHERE u.id = v.auth_user_id)
  `
  if (mismatches.length > 0) {
    console.log(`\nWARNING: ${mismatches.length} volunteers have auth_user_id values not found in Better Auth user table:`)
    for (const m of mismatches) {
      console.log(`  volunteer ${m.id} (${m.email}) → auth_user_id: ${m.auth_user_id}`)
    }
  } else {
    console.log(`\nAll volunteers.auth_user_id values match Better Auth user table`)
  }

  await sql.end()
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
