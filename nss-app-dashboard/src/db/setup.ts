/**
 * Database Setup Script
 *
 * This is the SINGLE entry point for database initialization.
 * Run with: npm run db:setup
 *
 * This script:
 * 1. Pushes Drizzle schema (tables, indexes, constraints)
 * 2. Runs SQL migrations in order (auth, RLS, seed data)
 *
 * Migrations are the SOURCE OF TRUTH - all SQL lives in:
 *   /src/db/migrations/0001_auth_and_rls.sql
 *   /src/db/migrations/0002_seed_data.sql
 */

import 'dotenv/config'
import { execSync } from 'child_process'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'
import postgres from 'postgres'

config({ path: '.env.local' })

const MIGRATIONS_DIR = join(__dirname, 'migrations')

async function setup() {
  console.log('🚀 NSS App Database Setup\n')
  console.log('='.repeat(60))

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // Step 1: Push Drizzle schema
  console.log('\n📌 Step 1: Pushing Drizzle schema (tables, indexes, constraints)...')
  console.log('   (RLS policies will be dropped by Drizzle, then recreated by migrations)')
  try {
    // Use 'yes' to auto-accept the prompt - RLS policies will be recreated by migrations
    execSync('yes | npx drizzle-kit push --force', {
      stdio: 'inherit',
      shell: '/bin/bash',
    })
    console.log('   ✅ Drizzle schema pushed successfully')
  } catch (error) {
    console.error('   ❌ Failed to push Drizzle schema')
    throw error
  }

  // Step 2: Run SQL migrations
  console.log('\n📌 Step 2: Running SQL migrations...')

  const client = postgres(process.env.DATABASE_URL, { max: 1 })

  try {
    // Get all SQL files (excluding Drizzle's 0000 schema file)
    const migrationFiles = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql') && !f.startsWith('0000'))
      .sort()

    console.log(`   Found ${migrationFiles.length} migration(s) to run:`)
    migrationFiles.forEach((f) => console.log(`   - ${f}`))

    for (const file of migrationFiles) {
      const filePath = join(MIGRATIONS_DIR, file)
      const sql = readFileSync(filePath, 'utf-8')

      console.log(`\n   📄 Running ${file}...`)

      try {
        await client.unsafe(sql)
        console.log(`   ✅ ${file} completed`)
      } catch (error: any) {
        // Handle expected notices (like "trigger does not exist, skipping")
        if (error.severity === 'NOTICE') {
          console.log(`   ⚠️  Notice: ${error.message}`)
        } else {
          console.error(`   ❌ Error in ${file}:`, error.message)
          throw error
        }
      }
    }

    // Step 3: Verify setup
    console.log('\n📌 Step 3: Verifying setup...')

    const triggers = await client`
      SELECT trigger_name FROM information_schema.triggers
      WHERE trigger_name IN ('on_auth_user_created', 'on_auth_user_deleted')
    `
    console.log(`   ✅ Auth triggers: ${triggers.length}/2`)

    const functions = await client`
      SELECT routine_name FROM information_schema.routines
      WHERE routine_name IN ('is_admin', 'has_role', 'get_current_volunteer_id', 'handle_new_user')
      AND routine_schema = 'public'
    `
    console.log(`   ✅ Helper functions: ${functions.length}`)

    const roles = await client`SELECT COUNT(*) as count FROM role_definitions`
    console.log(`   ✅ Role definitions: ${roles[0].count}`)

    const categories = await client`SELECT COUNT(*) as count FROM event_categories`
    console.log(`   ✅ Event categories: ${categories[0].count}`)

    const policies = await client`
      SELECT COUNT(*) as count FROM pg_policies WHERE schemaname = 'public'
    `
    console.log(`   ✅ RLS policies: ${policies[0].count}`)

    console.log('\n' + '='.repeat(60))
    console.log('✨ Database setup completed successfully!\n')
    console.log('Your database now has:')
    console.log('  • Tables with indexes and constraints (Drizzle)')
    console.log('  • Auth triggers (signup → volunteer + role)')
    console.log('  • Auth delete handling (soft-delete)')
    console.log('  • RLS policies on all tables')
    console.log('  • Admin functions for CRUD operations')
    console.log('  • Auto-update triggers for updated_at')
    console.log('  • Seed data (roles + categories)')
    console.log('')
    console.log('Next steps:')
    console.log('  1. Sign up a user in your app')
    console.log('  2. Run: npx tsx src/db/diagnose.ts')
    console.log('  3. You should see the new volunteer linked to auth')
    console.log('')
  } catch (error) {
    console.error('\n❌ Setup failed:', error)
    throw error
  } finally {
    await client.end()
  }
}

// Run setup
setup()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
