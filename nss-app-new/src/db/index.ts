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
 * - max: 10 connections (allows parallel queries without exhausting pool)
 * - idle_timeout: 20 seconds before closing idle connections
 * - connect_timeout: 15 seconds connection timeout
 * - max_lifetime: 60*5 seconds — recycle connections before pooler drops them
 * - prepare: false (required for connection poolers like Supavisor)
 */
const client = postgres(process.env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 15,
  max_lifetime: 60 * 5,
  prepare: false,
  connection: {
    application_name: 'nss-app',
  },
})

/**
 * Drizzle ORM database instance with schema
 */
export const db = drizzle(client, { schema })

/**
 * Retry wrapper for transient DB/network failures.
 * Retries up to `attempts` times with a short delay between each try.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts: number = 3,
  delayMs: number = 500
): Promise<T> {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      const isTransient =
        err instanceof Error &&
        (err.message.includes('CONNECT_TIMEOUT') ||
          err.message.includes('connection terminated') ||
          err.message.includes('Connection terminated') ||
          err.message.includes('write CONNECT_TIMEOUT') ||
          err.message.includes('Failed query'))
      if (!isTransient || i === attempts) throw err
      await new Promise((r) => setTimeout(r, delayMs * i))
    }
  }
  throw new Error('withRetry: unreachable')
}

/**
 * Type exports for use in other modules
 */
export type DbClient = typeof db
