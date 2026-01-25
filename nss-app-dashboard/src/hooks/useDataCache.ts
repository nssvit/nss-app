'use client'

/**
 * Simple client-side data cache for hooks
 *
 * This provides a lightweight caching layer to prevent
 * redundant server action calls within the same session.
 */

import { useRef, useCallback } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
}

// Global cache store (persists across component remounts)
const globalCache = new Map<string, CacheEntry<any>>()

// Default cache duration: 2 minutes
const DEFAULT_CACHE_DURATION = 2 * 60 * 1000

/**
 * Hook for caching fetch results
 *
 * @param key - Unique cache key
 * @param fetcher - Async function that fetches data
 * @param duration - Cache duration in ms (default: 2 minutes)
 */
export function useCachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  duration: number = DEFAULT_CACHE_DURATION
) {
  const fetchingRef = useRef(false)

  const fetchWithCache = useCallback(
    async (forceRefresh = false): Promise<T> => {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = globalCache.get(key)
        if (cached && Date.now() - cached.timestamp < duration) {
          return cached.data
        }
      }

      // Prevent duplicate fetches
      if (fetchingRef.current) {
        // Wait for existing fetch to complete
        await new Promise((resolve) => setTimeout(resolve, 100))
        const cached = globalCache.get(key)
        if (cached) return cached.data
      }

      try {
        fetchingRef.current = true
        const data = await fetcher()

        // Store in cache
        globalCache.set(key, {
          data,
          timestamp: Date.now(),
        })

        return data
      } finally {
        fetchingRef.current = false
      }
    },
    [key, fetcher, duration]
  )

  const invalidateCache = useCallback(() => {
    globalCache.delete(key)
  }, [key])

  const getCachedData = useCallback((): T | null => {
    const cached = globalCache.get(key)
    if (cached && Date.now() - cached.timestamp < duration) {
      return cached.data
    }
    return null
  }, [key, duration])

  return {
    fetch: fetchWithCache,
    invalidate: invalidateCache,
    getCached: getCachedData,
  }
}

/**
 * Clear all cached data
 */
export function clearAllCache() {
  globalCache.clear()
}

/**
 * Clear cache entries by prefix
 */
export function clearCacheByPrefix(prefix: string) {
  for (const key of globalCache.keys()) {
    if (key.startsWith(prefix)) {
      globalCache.delete(key)
    }
  }
}

/**
 * Get cache stats (for debugging)
 */
export function getCacheStats() {
  return {
    size: globalCache.size,
    keys: Array.from(globalCache.keys()),
  }
}
