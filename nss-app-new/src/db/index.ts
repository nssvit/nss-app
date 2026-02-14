/**
 * Drizzle ORM Database Connection
 *
 * This module provides the database connection for server-side operations.
 *
 * IMPORTANT: This connection is for SERVER-SIDE USE ONLY (API routes, server actions).
 * - Use Supabase client for client-side queries (relies on RLS)
 * - Use Supabase client for real-time subscriptions
 * - Use Supabase client for Auth operations
 *
 * This Drizzle connection bypasses RLS, so authorization must be handled in application code.
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Check for DATABASE_URL at runtime to fail fast
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is not set. ' +
      'Please add it to your .env.local file. ' +
      'You can find this in your Supabase project settings under Database > Connection string.'
  )
}

/**
 * PostgreSQL client for Drizzle ORM
 *
 * Configuration optimized for Vercel/serverless:
 * - max: 5 connections (allows parallel queries without exhausting pool)
 * - idle_timeout: 20 seconds before closing idle connections
 * - connect_timeout: 10 seconds connection timeout
 * - prepare: false (required for connection poolers like Supavisor)
 */
const client = postgres(process.env.DATABASE_URL, {
  max: 10, // Enough for dashboard's 10 parallel queries
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false, // Required for Supabase connection pooler
})

/**
 * Drizzle ORM database instance with schema
 *
 * Usage:
 * ```typescript
 * import { db } from '@/db'
 * import { volunteers } from '@/db/schema'
 * import { eq } from 'drizzle-orm'
 *
 * // Query all volunteers
 * const allVolunteers = await db.select().from(volunteers)
 *
 * // Query with relations
 * const volunteersWithRoles = await db.query.volunteers.findMany({
 *   with: { assignedRoles: true }
 * })
 *
 * // Insert new volunteer
 * const newVolunteer = await db.insert(volunteers).values({
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   rollNumber: '12345',
 *   email: 'john@example.com',
 *   branch: 'CMPN',
 *   year: 'SE'
 * }).returning()
 *
 * // Update volunteer
 * await db.update(volunteers)
 *   .set({ isActive: false })
 *   .where(eq(volunteers.id, 'some-uuid'))
 * ```
 */
export const db = drizzle(client, { schema })

/**
 * Type exports for use in other modules
 */
export type DbClient = typeof db

// Re-export schema for convenience
export * from './schema'
