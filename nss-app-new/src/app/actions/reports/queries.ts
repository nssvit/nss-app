'use server'

import { queries } from '@/db/queries'
import { getAuthUser } from '@/lib/auth-cache'
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
  const rows = await queries.getCategoryDistribution()
  return rows.map(mapCategoryDistributionRow)
}

/**
 * Get top events by impact score
 * Impact = participant_count × total_hours
 */
export async function getTopEventsByImpact(limit?: number) {
  await getAuthUser()
  const rows = await queries.getTopEventsByImpact(limit)
  return rows.map(mapTopEventRow)
}
