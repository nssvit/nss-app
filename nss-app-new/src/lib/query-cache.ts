/**
 * Cached Query Wrappers
 *
 * Uses Next.js unstable_cache for server-side caching of slow-changing data.
 * Each cached query has a TTL (time-to-live) and cache tags for on-demand invalidation.
 *
 * Cache invalidation:
 * - 'dashboard-stats' tag → revalidated on event/attendance/hours mutations
 * - 'categories' tag → revalidated on category create/update/delete
 * - 'role-definitions' tag → revalidated on role definition create/update
 */

import { unstable_cache } from 'next/cache'
import { queries } from '@/db/queries'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { eventCategories } from '@/db/schema'

/** Dashboard stats — refreshes every 60 seconds or on mutation */
export const getCachedDashboardStats = unstable_cache(
  () => queries.getDashboardStats(),
  ['dashboard-stats'],
  { revalidate: 60, tags: ['dashboard-stats'] }
)

/** Monthly activity trends — refreshes every 60 seconds or on mutation */
export const getCachedMonthlyTrends = unstable_cache(
  () => queries.getMonthlyActivityTrends(),
  ['monthly-trends'],
  { revalidate: 60, tags: ['dashboard-stats'] }
)

/** Active categories — refreshes every 5 minutes or on mutation */
export const getCachedCategories = unstable_cache(
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
  { revalidate: 300, tags: ['categories'] }
)

/** Role definitions — refreshes every 5 minutes or on mutation */
export const getCachedRoleDefinitions = unstable_cache(
  () => queries.getAllRoles(),
  ['role-definitions'],
  { revalidate: 300, tags: ['role-definitions'] }
)
