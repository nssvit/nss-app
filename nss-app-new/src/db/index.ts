/**
 * Drizzle ORM Database Connection — Modular Provider System
 *
 * Providers self-register via side-effect imports below.
 * The DATABASE env var controls which provider is the default:
 *   DATABASE=neon      → Neon is primary
 *   DATABASE=supabase  → Supabase is primary
 *   (not set)          → first registered provider wins
 *
 * To remove a provider: delete its import + delete its file + remove env vars.
 *
 * The exported `db` is a Proxy that delegates to the currently active
 * Drizzle instance, so all existing queries work without changes.
 */

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from './schema'

// --- Provider registration ---
import './providers/neon'
import './providers/supabase'

import {
  getProvider,
  getDefaultProvider,
  setDefaultProvider,
  isDualMode,
} from './providers/registry'
import { getActiveProvider, cachedProviderSync } from '@/lib/db-provider'

// --- Apply DATABASE env var override ---
if (process.env.DATABASE) {
  setDefaultProvider(process.env.DATABASE.toLowerCase())
}

// Validate at startup: at least one provider must exist
const defaultDb = getDefaultProvider()

// --- Active DB resolver ---

/** Get the Drizzle instance for the currently active provider */
export async function getDb(): Promise<PostgresJsDatabase<typeof schema>> {
  if (!isDualMode()) return defaultDb

  const provider = await getActiveProvider()
  return getProvider(provider) ?? defaultDb
}

/** Get a specific provider's Drizzle instance (for health checks, admin) */
export function getDbForProvider(provider: string): PostgresJsDatabase<typeof schema> | null {
  return getProvider(provider)
}

// --- Backward-compatible `db` export ---

/**
 * Proxy-based `db` that delegates to the active provider.
 * This lets all existing code (`db.query.xxx`, `db.select()`, etc.)
 * work without any changes — the proxy resolves the active DB on each access.
 *
 * For hot-path operations, consider using `await getDb()` directly
 * to avoid the proxy overhead.
 */
export const db: PostgresJsDatabase<typeof schema> = new Proxy(defaultDb, {
  get(target, prop, receiver) {
    if (!isDualMode()) return Reflect.get(target, prop, receiver)

    const activeDb = getProvider(cachedProviderSync()) ?? target
    return Reflect.get(activeDb, prop, receiver)
  },
}) as PostgresJsDatabase<typeof schema>

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

export type DbClient = typeof db
