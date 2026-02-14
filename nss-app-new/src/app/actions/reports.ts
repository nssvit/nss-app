'use server'

import { queries } from '@/db/queries'
import { createClient } from '@/lib/supabase/server'
import {
  mapCategoryDistributionRow,
  mapTopEventRow,
  mapAttendanceSummaryRow,
  mapVolunteerHoursSummaryRow,
} from '@/lib/mappers'

/**
 * Auth helper - ensures user is authenticated
 */
async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized: Please sign in')
  }

  return user
}

/**
 * Get category distribution for reports
 * Returns: event count, participant count, total hours per category
 */
export async function getCategoryDistribution() {
  await requireAuth()
  const rows = await queries.getCategoryDistribution()
  return rows.map(mapCategoryDistributionRow)
}

/**
 * Get top events by impact score
 * Impact = participant_count × total_hours
 */
export async function getTopEventsByImpact(limit?: number) {
  await requireAuth()
  const rows = await queries.getTopEventsByImpact(limit)
  return rows.map(mapTopEventRow)
}

/**
 * Get attendance summary per event
 * Returns: registered, present, absent counts, attendance rate
 */
export async function getAttendanceSummary() {
  await requireAuth()
  const rows = await queries.getAttendanceSummary()
  return rows.map(mapAttendanceSummaryRow)
}

/**
 * Get volunteer hours summary
 * Returns: per-volunteer total hours, approved hours, events count
 */
export async function getVolunteerHoursSummary() {
  await requireAuth()
  const rows = await queries.getVolunteerHoursSummary()
  return rows.map(mapVolunteerHoursSummaryRow)
}

/**
 * Get monthly activity trends
 * Returns: last 12 months of activity data
 */
export async function getMonthlyTrends() {
  await requireAuth()
  const rows = await queries.getMonthlyActivityTrends()
  return rows.map((r) => ({
    month: r.month,
    monthNumber: r.month_number,
    yearNumber: r.year_number,
    eventsCount: r.events_count,
    volunteersCount: r.volunteers_count,
    hoursSum: r.hours_sum,
  }))
}

/**
 * Get user statistics
 * Returns: total users, active, pending, admin count
 */
export async function getUserStats() {
  await requireAuth()
  return queries.getUserStats()
}

/**
 * Get dashboard stats
 * Returns: totalEvents, activeVolunteers, totalHours, ongoingProjects
 */
export async function getDashboardStats() {
  await requireAuth()
  return queries.getDashboardStats()
}
