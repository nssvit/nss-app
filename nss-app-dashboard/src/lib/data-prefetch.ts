'use client'

/**
 * Data Prefetch System
 *
 * Prefetches common data during auth to reduce perceived load times.
 * Data is stored in a global cache and used by hooks on first render.
 */

import { getFullAdminDashboard, getHeadsDashboardStats } from '@/app/actions/dashboard'
import { getVolunteerDashboardData } from '@/app/actions/volunteers'
import { getEvents } from '@/app/actions/events'

// Global prefetch cache
interface PrefetchCache {
  adminDashboard: any | null
  headsDashboard: any | null
  volunteerDashboard: any | null
  events: any[] | null
  timestamp: number
  prefetching: boolean
}

const prefetchCache: PrefetchCache = {
  adminDashboard: null,
  headsDashboard: null,
  volunteerDashboard: null,
  events: null,
  timestamp: 0,
  prefetching: false,
}

const CACHE_DURATION = 120000 // 2 minutes

/**
 * Check if cache is valid
 */
function isCacheValid(): boolean {
  return Date.now() - prefetchCache.timestamp < CACHE_DURATION
}

/**
 * Prefetch data based on user roles
 * Called after successful auth to preload dashboard data
 */
export async function prefetchDashboardData(roles: string[]): Promise<void> {
  // Prevent duplicate prefetch calls
  if (prefetchCache.prefetching) return
  prefetchCache.prefetching = true

  console.log('[Prefetch] Starting data prefetch for roles:', roles)
  const startTime = Date.now()

  try {
    const promises: Promise<void>[] = []

    // Always prefetch events (used by multiple pages)
    promises.push(
      getEvents()
        .then((data) => {
          prefetchCache.events = data
        })
        .catch((err) => console.warn('[Prefetch] Events failed:', err.message))
    )

    // Prefetch based on role
    if (roles.includes('admin')) {
      promises.push(
        getFullAdminDashboard(6)
          .then((data) => {
            prefetchCache.adminDashboard = data
          })
          .catch((err) => console.warn('[Prefetch] Admin dashboard failed:', err.message))
      )
    } else if (
      roles.some((r) => ['program_officer', 'event_lead', 'documentation_lead'].includes(r))
    ) {
      promises.push(
        getHeadsDashboardStats()
          .then((data) => {
            prefetchCache.headsDashboard = data
          })
          .catch((err) => console.warn('[Prefetch] Heads dashboard failed:', err.message))
      )
    } else {
      promises.push(
        getVolunteerDashboardData()
          .then((data) => {
            prefetchCache.volunteerDashboard = data
          })
          .catch((err) => console.warn('[Prefetch] Volunteer dashboard failed:', err.message))
      )
    }

    // Run all prefetches in parallel
    await Promise.all(promises)

    prefetchCache.timestamp = Date.now()
    console.log('[Prefetch] Completed in', Date.now() - startTime, 'ms')
  } catch (error) {
    console.error('[Prefetch] Error:', error)
  } finally {
    prefetchCache.prefetching = false
  }
}

/**
 * Get prefetched admin dashboard data
 */
export function getPrefetchedAdminDashboard(): any | null {
  if (isCacheValid() && prefetchCache.adminDashboard) {
    console.log('[Prefetch] Using cached admin dashboard')
    return prefetchCache.adminDashboard
  }
  return null
}

/**
 * Get prefetched heads dashboard data
 */
export function getPrefetchedHeadsDashboard(): any | null {
  if (isCacheValid() && prefetchCache.headsDashboard) {
    console.log('[Prefetch] Using cached heads dashboard')
    return prefetchCache.headsDashboard
  }
  return null
}

/**
 * Get prefetched volunteer dashboard data
 */
export function getPrefetchedVolunteerDashboard(): any | null {
  if (isCacheValid() && prefetchCache.volunteerDashboard) {
    console.log('[Prefetch] Using cached volunteer dashboard')
    return prefetchCache.volunteerDashboard
  }
  return null
}

/**
 * Get prefetched events data
 */
export function getPrefetchedEvents(): any[] | null {
  if (isCacheValid() && prefetchCache.events) {
    console.log('[Prefetch] Using cached events')
    return prefetchCache.events
  }
  return null
}

/**
 * Clear all prefetched data
 */
export function clearPrefetchCache(): void {
  prefetchCache.adminDashboard = null
  prefetchCache.headsDashboard = null
  prefetchCache.volunteerDashboard = null
  prefetchCache.events = null
  prefetchCache.timestamp = 0
}

/**
 * Check if data is currently being prefetched
 */
export function isPrefetching(): boolean {
  return prefetchCache.prefetching
}
