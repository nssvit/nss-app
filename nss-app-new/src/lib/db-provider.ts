/**
 * Database Provider Switching
 *
 * Manages which database provider is active.
 * State is stored in Redis so all serverless instances see the same value.
 * Includes an in-memory cache (30s TTL) to avoid Redis on every query.
 */

import { Redis } from '@upstash/redis'
import { getDefaultProviderName } from '@/db/providers/registry'

export type DbProvider = string

const REDIS_KEY = 'nss:active_db'
const CACHE_TTL_MS = 30_000

let cachedProvider: string | null = null
let cacheTimestamp = 0
let redisInstance: Redis | null = null

function getRedis(): Redis | null {
  if (redisInstance) return redisInstance

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  redisInstance = new Redis({ url, token })
  return redisInstance
}

/**
 * Get the currently active database provider.
 * Uses a 30s in-memory cache to minimize Redis calls.
 */
export async function getActiveProvider(): Promise<string> {
  if (cachedProvider && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedProvider
  }

  const fallback = getDefaultProviderName()
  const redis = getRedis()
  if (!redis) {
    cachedProvider = fallback
    cacheTimestamp = Date.now()
    return fallback
  }

  try {
    const value = await redis.get<string>(REDIS_KEY)
    const provider = value ?? fallback
    cachedProvider = provider
    cacheTimestamp = Date.now()
    return provider
  } catch {
    return cachedProvider ?? fallback
  }
}

/**
 * Set the active database provider.
 * Clears in-memory cache so next query picks up the change.
 */
export async function setActiveProvider(provider: string): Promise<void> {
  const redis = getRedis()
  if (!redis) throw new Error('Redis is not configured')

  await redis.set(REDIS_KEY, provider)

  cachedProvider = provider
  cacheTimestamp = Date.now()
}

/**
 * Synchronous access to the cached provider value.
 * Used by the db Proxy which can't await in a get() trap.
 * Falls back to default provider if no cached value exists.
 */
export function cachedProviderSync(): string {
  return cachedProvider ?? getDefaultProviderName()
}

/**
 * Clear the in-memory cache (useful for testing or forced refresh).
 */
export function clearProviderCache(): void {
  cachedProvider = null
  cacheTimestamp = 0
}
