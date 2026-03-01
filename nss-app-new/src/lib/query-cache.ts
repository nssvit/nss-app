/**
 * Cached Query Wrappers
 *
 * Dual-layer caching: Redis (persistent, cross-instance) → unstable_cache (per-instance ISR) → DB.
 *
 * Redis survives serverless cold starts and deployments.
 * unstable_cache acts as a fast in-process fallback.
 *
 * Cache invalidation:
 * - 'dashboard-stats' tag → revalidated on event/attendance/hours mutations
 * - 'categories' tag → revalidated on category create/update/delete
 * - 'role-definitions' tag → revalidated on role definition create/update
 * - Redis keys → invalidated via cache-invalidation.ts helpers
 */

import { unstable_cache } from 'next/cache'
import { queries } from '@/db/queries'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { eventCategories } from '@/db/schema'
import { getOrSetCache, CACHE_KEYS, CACHE_TTL } from './redis'

// --- Dashboard (Tier 1 — 60s Redis, 60s ISR) ---

/** Fetch from unstable_cache (ISR fallback when Redis misses) */
const _getCachedDashboardStats = unstable_cache(
  () => queries.getDashboardStats(),
  ['dashboard-stats'],
  { revalidate: 60, tags: ['dashboard-stats'] },
)

/** Dashboard stats — Redis first, then ISR, then DB */
export function getCachedDashboardStats() {
  return getOrSetCache(
    CACHE_KEYS.DASHBOARD_STATS,
    CACHE_TTL.SHORT,
    _getCachedDashboardStats,
  )
}

const _getCachedMonthlyTrends = unstable_cache(
  () => queries.getMonthlyActivityTrends(),
  ['monthly-trends'],
  { revalidate: 60, tags: ['dashboard-stats'] },
)

/** Monthly activity trends — Redis first, then ISR, then DB */
export function getCachedMonthlyTrends() {
  return getOrSetCache(
    CACHE_KEYS.MONTHLY_TRENDS,
    CACHE_TTL.LONG,
    _getCachedMonthlyTrends,
  )
}

// --- Reference data (Tier 2 — 300s Redis, 300s ISR) ---

const _getCachedCategories = unstable_cache(
  async () => {
    const rows = await db.query.eventCategories.findMany({
      where: eq(eventCategories.isActive, true),
      orderBy: (categories, { asc }) => [asc(categories.categoryName)],
    })
    return rows.map((r) => ({
      ...r,
      colorHex: r.colorHex ?? '#6366F1',
      isActive: r.isActive ?? true,
    }))
  },
  ['categories'],
  { revalidate: 300, tags: ['categories'] },
)

/** Active categories — Redis first, then ISR, then DB */
export function getCachedCategories() {
  return getOrSetCache(
    CACHE_KEYS.CATEGORIES,
    CACHE_TTL.MEDIUM,
    _getCachedCategories,
  )
}

const _getCachedRoleDefinitions = unstable_cache(
  () => queries.getAllRoles(),
  ['role-definitions'],
  { revalidate: 300, tags: ['role-definitions'] },
)

/** Role definitions — Redis first, then ISR, then DB */
export function getCachedRoleDefinitions() {
  return getOrSetCache(
    CACHE_KEYS.ROLE_DEFINITIONS,
    CACHE_TTL.MEDIUM,
    _getCachedRoleDefinitions,
  )
}

// --- Report aggregates (Tier 1 — 300s Redis, no ISR) ---

/** Category distribution — Redis cached, 5 min TTL */
export function getCachedCategoryDistribution() {
  return getOrSetCache(
    CACHE_KEYS.CATEGORY_DISTRIBUTION,
    CACHE_TTL.MEDIUM,
    () => queries.getCategoryDistribution(),
  )
}

/** Top events by impact — Redis cached, 5 min TTL */
export function getCachedTopEventsByImpact(limit?: number) {
  return getOrSetCache(
    CACHE_KEYS.TOP_EVENTS,
    CACHE_TTL.MEDIUM,
    () => queries.getTopEventsByImpact(limit),
  )
}

/** Attendance summary — Redis cached, 60s TTL */
export function getCachedAttendanceSummary() {
  return getOrSetCache(
    CACHE_KEYS.ATTENDANCE_SUMMARY,
    CACHE_TTL.SHORT,
    () => queries.getAttendanceSummary(),
  )
}

/** Volunteer hours summary — Redis cached, 5 min TTL */
export function getCachedVolunteerHoursSummary() {
  return getOrSetCache(
    CACHE_KEYS.VOLUNTEER_HOURS,
    CACHE_TTL.MEDIUM,
    () => queries.getVolunteerHoursSummary(),
  )
}
