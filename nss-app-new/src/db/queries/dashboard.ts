/**
 * Dashboard Statistics Queries
 * Provides dashboard-specific statistics and activity trends
 */

import { sql } from 'drizzle-orm'
import { parseRows, monthlyTrendRowSchema } from '../query-validators'
import { db } from '../index'

/**
 * Get dashboard statistics — single query replaces 4 sequential round-trips.
 * Uses scalar subqueries so Postgres resolves all counts in one execution.
 */
export async function getDashboardStats() {
  const result = await db.execute(sql`
    SELECT
      (SELECT COUNT(*)::int FROM events WHERE is_active = true) as total_events,
      (SELECT COUNT(*)::int FROM volunteers WHERE is_active = true) as active_volunteers,
      (SELECT COALESCE(SUM(ep.approved_hours), 0)::int
       FROM event_participation ep
       INNER JOIN events e ON ep.event_id = e.id
       WHERE ep.approval_status = 'approved' AND e.is_active = true) as total_hours,
      (SELECT COUNT(*)::int FROM events WHERE is_active = true AND event_status = 'ongoing') as ongoing_projects
  `)

  const row = (Array.isArray(result) ? result[0] : null) as {
    total_events: number
    active_volunteers: number
    total_hours: number
    ongoing_projects: number
  } | null
  return {
    totalEvents: Number(row?.total_events) || 0,
    activeVolunteers: Number(row?.active_volunteers) || 0,
    totalHours: Number(row?.total_hours) || 0,
    ongoingProjects: Number(row?.ongoing_projects) || 0,
  }
}

/**
 * Get monthly activity trends for the last 12 months
 * Replaces: get_monthly_activity_trends RPC function
 */
export async function getMonthlyActivityTrends() {
  const result = await db.execute(sql`
    SELECT
      TO_CHAR(DATE_TRUNC('month', e.start_date), 'Mon') as month,
      EXTRACT(MONTH FROM DATE_TRUNC('month', e.start_date))::int as month_number,
      EXTRACT(YEAR FROM DATE_TRUNC('month', e.start_date))::int as year_number,
      COUNT(DISTINCT e.id)::int as events_count,
      COUNT(DISTINCT ep.volunteer_id)::int as volunteers_count,
      COALESCE(SUM(ep.approved_hours), 0)::int as hours_sum
    FROM events e
    LEFT JOIN event_participation ep ON e.id = ep.event_id
    WHERE e.is_active = true
      AND e.start_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months')
    GROUP BY DATE_TRUNC('month', e.start_date)
    ORDER BY DATE_TRUNC('month', e.start_date)
  `)

  return parseRows(result, monthlyTrendRowSchema)
}
