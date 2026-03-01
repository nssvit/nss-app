/**
 * Upstash Redis Client & Cache Helpers
 *
 * Provides a persistent cache layer that survives serverless cold starts
 * and is shared across all instances. Used alongside Next.js unstable_cache
 * for a dual-layer caching strategy:
 *
 *   Request → Redis (fast, persistent) → unstable_cache (per-instance) → DB
 *
 * Cache keys follow the pattern: nss:{domain}:{resource}[:{id}]
 */

import { Redis } from '@upstash/redis'

// --- Client singleton ---

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.warn('[redis] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set — Redis caching disabled')
    return null
  }

  redis = new Redis({ url, token })
  return redis
}

// --- Cache key constants ---

export const CACHE_KEYS = {
  // Dashboard (Tier 1 — 5min, invalidated on mutation)
  DASHBOARD_STATS: 'nss:dashboard:stats',
  MONTHLY_TRENDS: 'nss:dashboard:trends',

  // Reports (Tier 1 — 10min, invalidated on mutation)
  CATEGORY_DISTRIBUTION: 'nss:reports:category-dist',
  TOP_EVENTS: 'nss:reports:top-events',
  ATTENDANCE_SUMMARY: 'nss:reports:attendance-summary',
  VOLUNTEER_HOURS: 'nss:reports:volunteer-hours',

  // Reference data (Tier 2 — 10min, invalidated on mutation)
  CATEGORIES: 'nss:categories:active',
  ROLE_DEFINITIONS: 'nss:roles:definitions',
} as const

export const CACHE_TTL = {
  /**
   * Dashboard stats, attendance summary — 5 min.
   * Mutations invalidate immediately, so TTL only governs idle periods
   * where data hasn't changed anyway. No need for aggressive 60s polling.
   */
  SHORT: 300,
  /** Report aggregates, reference data — 10 min (rarely changes without mutation) */
  MEDIUM: 600,
  /** Monthly trends — 1 hour (historical, practically immutable between mutations) */
  LONG: 3600,
} as const

// --- Core cache helper ---

/**
 * Get-or-set cache pattern with Redis.
 * On Redis miss or error, falls through to the fetcher.
 * Cache writes are fire-and-forget (don't block response).
 */
export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const client = getRedis()

  // Redis unavailable — go straight to DB
  if (!client) return fetcher()

  try {
    const cached = await client.get<T>(key)
    if (cached !== null && cached !== undefined) {
      return cached
    }
  } catch (err) {
    console.warn(`[redis] cache read failed for ${key}:`, err)
    // Fall through to fetcher
  }

  const fresh = await fetcher()

  // Fire-and-forget write — don't block the response
  client.set(key, fresh, { ex: ttlSeconds }).catch((err) => {
    console.warn(`[redis] cache write failed for ${key}:`, err)
  })

  return fresh
}

// --- Invalidation helpers ---

/**
 * Delete one or more cache keys from Redis.
 * Fire-and-forget — errors are logged but don't throw.
 */
export async function invalidateKeys(keys: string[]): Promise<void> {
  const client = getRedis()
  if (!client || keys.length === 0) return

  try {
    await client.del(...keys)
  } catch (err) {
    console.warn('[redis] invalidation failed:', err)
  }
}
