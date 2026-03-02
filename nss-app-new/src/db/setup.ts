/**
 * Database Setup Script (Fresh DB Only)
 *
 * This is for INITIAL SETUP of a new database.
 * For incremental updates, use: npm run db:migrate
 *
 * Run with: npm run db:setup
 *
 * This script:
 * 1. Pushes Drizzle schema (tables, indexes, constraints)
 * 2. Creates the _migrations tracking table
 * 3. Runs ALL SQL migrations in order
 * 4. Records all migrations as applied
 * 5. Verifies the final state
 */

import 'dotenv/config'
import { execSync } from 'child_process'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'
import postgres from 'postgres'
import { resolveDatabaseUrl } from './resolve-url'

config({ path: '.env.local' })

const MIGRATIONS_DIR = join(__dirname, 'migrations')

async function setup() {
  console.log('🚀 NSS App Database Setup (Fresh)\n')
  console.log('='.repeat(60))

  // Step 1: Push Drizzle schema
  console.log('\n📌 Step 1: Pushing Drizzle schema (tables, indexes, constraints)...')
  try {
    execSync('yes | npx drizzle-kit push --force', {
      stdio: 'inherit',
      shell: '/bin/bash',
    })
    console.log('   ✅ Drizzle schema pushed successfully')
  } catch (error) {
    console.error('   ❌ Failed to push Drizzle schema')
    throw error
  }

  // Step 2: Run SQL migrations with tracking
  console.log('\n📌 Step 2: Running SQL migrations...')

  const client = postgres(resolveDatabaseUrl(), { max: 1 })

  try {
    // Create migrations tracking table
    await client`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `

    // Get all SQL files
    const migrationFiles = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql') && !f.startsWith('0000'))
      .sort()

    console.log(`   Found ${migrationFiles.length} migration(s) to run:`)
    migrationFiles.forEach((f) => console.log(`   - ${f}`))

    for (const file of migrationFiles) {
      const filePath = join(MIGRATIONS_DIR, file)
      const sqlContent = readFileSync(filePath, 'utf-8')

      console.log(`\n   📄 Running ${file}...`)

      try {
        await client.unsafe(sqlContent)

        // Record migration as applied
        await client`
          INSERT INTO _migrations (filename) VALUES (${file})
          ON CONFLICT (filename) DO NOTHING
        `

        console.log(`   ✅ ${file} completed`)
      } catch (error: unknown) {
        const pgError = error as { severity?: string; message?: string }
        if (pgError.severity === 'NOTICE') {
          console.log(`   ⚠️  Notice: ${pgError.message}`)
          await client`
            INSERT INTO _migrations (filename) VALUES (${file})
            ON CONFLICT (filename) DO NOTHING
          `
        } else {
          console.error(`   ❌ Error in ${file}:`, pgError.message)
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

    const migrations = await client`SELECT COUNT(*) as count FROM _migrations`
    console.log(`   ✅ Migrations tracked: ${migrations[0].count}`)

    console.log('\n' + '='.repeat(60))
    console.log('✨ Database setup completed successfully!\n')
    console.log('Your database now has:')
    console.log('  - Tables with indexes and constraints (Drizzle)')
    console.log('  - Auth triggers (signup -> volunteer + role)')
    console.log('  - Auth delete handling (soft-delete)')
    console.log('  - RLS policies on all tables')
    console.log('  - Helper functions (is_admin, has_role)')
    console.log('  - Auto-update triggers for updated_at')
    console.log('  - Seed data (roles + categories)')
    console.log('  - Migration tracking table')
    console.log('')
    console.log('For future updates, use: npm run db:migrate')
    console.log('')
  } catch (error) {
    console.error('\n❌ Setup failed:', error)
    throw error
  } finally {
    await client.end()
  }
}

setup()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
