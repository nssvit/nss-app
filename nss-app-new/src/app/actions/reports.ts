'use server'

import { queries } from '@/db/queries'
import { createClient } from '@/lib/supabase/server'

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
  return queries.getCategoryDistribution()
}

/**
 * Get top events by impact score
 * Impact = participant_count × total_hours
 */
export async function getTopEventsByImpact(limit?: number) {
  await requireAuth()
  return queries.getTopEventsByImpact(limit)
}

/**
 * Get attendance summary per event
 * Returns: registered, present, absent counts, attendance rate
 */
export async function getAttendanceSummary() {
  await requireAuth()
  return queries.getAttendanceSummary()
}

/**
 * Get volunteer hours summary
 * Returns: per-volunteer total hours, approved hours, events count
 */
export async function getVolunteerHoursSummary() {
  await requireAuth()
  return queries.getVolunteerHoursSummary()
}

/**
 * Get monthly activity trends
 * Returns: last 12 months of activity data
 */
export async function getMonthlyTrends() {
  await requireAuth()
  return queries.getMonthlyActivityTrends()
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
