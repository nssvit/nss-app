'use server'

import { queries } from '@/db/queries'
import { getAuthUser } from '@/lib/auth-cache'
import { mapTrendRow } from '@/lib/mappers'

/**
 * Get dashboard statistics
 * Returns: totalEvents, activeVolunteers, totalHours, ongoingProjects
 */
export async function getDashboardStats() {
  await getAuthUser() // Cached auth check
  return queries.getDashboardStats()
}

/**
 * Get monthly activity trends for charts
 * Returns last 12 months of activity data
 */
export async function getMonthlyTrends() {
  await getAuthUser()
  const rows = await queries.getMonthlyActivityTrends()
  return rows.map(mapTrendRow)
}

/**
 * Get count of pending hour approvals
 */
export async function getPendingApprovalsCount() {
  await getAuthUser()
  return queries.getPendingApprovalsCount()
}

/**
 * Get user statistics
 * Returns: totalUsers, activeUsers, pendingUsers, adminCount
 */
export async function getUserStats() {
  await getAuthUser()
  return queries.getUserStats()
}
