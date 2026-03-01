'use server'

import { getAuthUser } from '@/lib/auth-cache'
import {
  getCachedCategoryDistribution,
  getCachedTopEventsByImpact,
} from '@/lib/query-cache'
import {
  mapCategoryDistributionRow,
  mapTopEventRow,
} from '@/lib/mappers'

/**
 * Get category distribution for reports
 * Returns: event count, participant count, total hours per category
 */
export async function getCategoryDistribution() {
  await getAuthUser()
  const rows = await getCachedCategoryDistribution()
  return rows.map(mapCategoryDistributionRow)
}

/**
 * Get top events by impact score
 * Impact = participant_count × total_hours
 */
export async function getTopEventsByImpact(limit?: number) {
  await getAuthUser()
  const rows = await getCachedTopEventsByImpact(limit)
  return rows.map(mapTopEventRow)
}
