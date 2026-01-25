/**
 * Database Diagnostic Script
 * Run with: npx tsx src/db/diagnose.ts
 */

import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

import postgres from 'postgres'

async function diagnose() {
  console.log('🔍 NSS App Database Diagnostics\n')
  console.log('='.repeat(60))

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set')
  }

  const client = postgres(process.env.DATABASE_URL, { max: 1 })

  try {
    // 1. Check auth trigger
    console.log('\n📌 1. Checking auth trigger on auth.users...')
    const triggers = await client`
      SELECT trigger_name, event_object_schema, event_object_table, action_timing, event_manipulation
      FROM information_schema.triggers
      WHERE trigger_name = 'on_auth_user_created'
    `
    if (triggers.length > 0) {
      console.log('   ✅ Trigger exists:', triggers[0])
    } else {
      console.log('   ❌ Trigger NOT FOUND on auth.users')
    }

    // 2. Check handle_new_user function
    console.log('\n📌 2. Checking handle_new_user function...')
    const functions = await client`
      SELECT routine_name, routine_schema, routine_type
      FROM information_schema.routines
      WHERE routine_name = 'handle_new_user' AND routine_schema = 'public'
    `
    if (functions.length > 0) {
      console.log('   ✅ Function exists:', functions[0])
    } else {
      console.log('   ❌ Function NOT FOUND')
    }

    // 3. Check helper functions
    console.log('\n📌 3. Checking helper functions...')
    const helpers = await client`
      SELECT routine_name, routine_schema
      FROM information_schema.routines
      WHERE routine_name IN ('is_admin', 'has_role', 'get_current_volunteer_id')
      AND routine_schema = 'public'
    `
    console.log(`   Found ${helpers.length}/3 helper functions:`)
    helpers.forEach((f) => console.log(`   ✅ ${f.routine_name}`))
    if (helpers.length < 3) {
      const found = helpers.map((h) => h.routine_name)
      const missing = ['is_admin', 'has_role', 'get_current_volunteer_id'].filter(
        (n) => !found.includes(n)
      )
      missing.forEach((m) => console.log(`   ❌ Missing: ${m}`))
    }

    // 4. Check updated_at triggers
    console.log('\n📌 4. Checking updated_at triggers...')
    const updateTriggers = await client`
      SELECT trigger_name, event_object_table
      FROM information_schema.triggers
      WHERE trigger_name = 'set_updated_at' AND event_object_schema = 'public'
    `
    console.log(`   Found ${updateTriggers.length}/6 updated_at triggers:`)
    updateTriggers.forEach((t) => console.log(`   ✅ ${t.event_object_table}`))

    // 5. Check RLS is enabled
    console.log('\n📌 5. Checking RLS status...')
    const rlsStatus = await client`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('volunteers', 'events', 'event_participation', 'event_categories', 'role_definitions', 'user_roles')
    `
    rlsStatus.forEach((t) => {
      const status = t.rowsecurity ? '✅ Enabled' : '❌ Disabled'
      console.log(`   ${status}: ${t.tablename}`)
    })

    // 6. Check RLS policies
    console.log('\n📌 6. Checking RLS policies...')
    const policies = await client`
      SELECT tablename, policyname
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `
    console.log(`   Found ${policies.length} policies:`)
    const byTable: Record<string, string[]> = {}
    policies.forEach((p) => {
      if (!byTable[p.tablename]) byTable[p.tablename] = []
      byTable[p.tablename].push(p.policyname)
    })
    Object.entries(byTable).forEach(([table, pols]) => {
      console.log(`   📋 ${table}: ${pols.length} policies`)
    })

    // 7. Check seed data
    console.log('\n📌 7. Checking seed data...')
    const roles = await client`SELECT role_name, display_name FROM role_definitions`
    console.log(`   Roles: ${roles.length}`)
    roles.forEach((r) => console.log(`   ✅ ${r.role_name} (${r.display_name})`))

    const categories = await client`SELECT category_name FROM event_categories`
    console.log(`   Categories: ${categories.length}`)

    // 8. Check volunteers and user linkage
    console.log('\n📌 8. Checking volunteer-auth linkage...')
    const volunteers = await client`
      SELECT v.id, v.auth_user_id, v.email, v.first_name, v.last_name,
             ur.id as user_role_id, rd.role_name
      FROM volunteers v
      LEFT JOIN user_roles ur ON ur.volunteer_id = v.id
      LEFT JOIN role_definitions rd ON rd.id = ur.role_definition_id
    `
    if (volunteers.length > 0) {
      console.log(`   Found ${volunteers.length} volunteer(s):`)
      volunteers.forEach((v) => {
        const linked = v.auth_user_id ? '🔗 Linked' : '⚠️  No auth_user_id'
        const role = v.role_name || 'No role'
        console.log(`   ${linked}: ${v.email} (${v.first_name} ${v.last_name}) - Role: ${role}`)
      })
    } else {
      console.log('   ℹ️  No volunteers yet (sign up a user to test)')
    }

    // 9. Check auth.users count
    console.log('\n📌 9. Checking auth.users...')
    try {
      const authUsers =
        await client`SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5`
      console.log(`   Found ${authUsers.length} auth user(s):`)
      authUsers.forEach((u) => console.log(`   👤 ${u.email} (${u.id})`))
    } catch (e) {
      console.log('   ⚠️  Cannot read auth.users (may need elevated permissions)')
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 SUMMARY')
    console.log('='.repeat(60))

    const issues: string[] = []
    if (triggers.length === 0) issues.push('Auth trigger missing')
    if (functions.length === 0) issues.push('handle_new_user function missing')
    if (helpers.length < 3) issues.push('Some helper functions missing')
    if (updateTriggers.length < 6) issues.push('Some updated_at triggers missing')

    if (issues.length === 0) {
      console.log('\n✅ All components are properly configured!')
      console.log('\nTo test the auth flow:')
      console.log('  1. Sign up a new user in your app')
      console.log('  2. Run this diagnostic again')
      console.log('  3. You should see the new volunteer linked to auth')
    } else {
      console.log('\n⚠️  Issues found:')
      issues.forEach((i) => console.log(`   - ${i}`))
      console.log('\nRun: npm run db:setup')
    }
  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error)
    throw error
  } finally {
    await client.end()
  }
}

diagnose()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
