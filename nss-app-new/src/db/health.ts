/**
 * Database Health Check
 *
 * Verifies connectivity and measures latency for each database provider.
 */

import { sql } from 'drizzle-orm'
import { getDbForProvider } from './index'
import { getRegisteredProviderNames } from './providers/registry'

export interface HealthResult {
  provider: string
  ok: boolean
  latencyMs: number
  error?: string
}

/**
 * Check connectivity and latency for a specific database provider.
 * Returns { ok: true, latencyMs } on success, { ok: false, error } on failure.
 */
export async function checkConnection(provider: string): Promise<HealthResult> {
  const db = getDbForProvider(provider)

  if (!db) {
    return {
      provider,
      ok: false,
      latencyMs: 0,
      error: `${provider} database is not configured`,
    }
  }

  const start = performance.now()
  try {
    await db.execute(sql`SELECT 1`)
    const latencyMs = Math.round(performance.now() - start)
    return { provider, ok: true, latencyMs }
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start)
    return {
      provider,
      ok: false,
      latencyMs,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Check health of all registered database providers.
 */
export async function checkAllConnections(): Promise<HealthResult[]> {
  const names = getRegisteredProviderNames()
  return Promise.all(names.map((name) => checkConnection(name)))
}
