/**
 * Dashboard Statistics Queries
 * Provides dashboard-specific statistics and activity trends
 */

import { db } from '../index'
import { eq, and, sql, count, sum } from 'drizzle-orm'
import { volunteers, events, eventParticipation } from '../schema'

/**
 * Get dashboard statistics
 * Replaces: get_dashboard_stats RPC function
 */
export async function getDashboardStats() {
  const [eventsCount] = await db
    .select({ count: count() })
    .from(events)
    .where(eq(events.isActive, true))

  const [volunteersCount] = await db
    .select({ count: count() })
    .from(volunteers)
    .where(eq(volunteers.isActive, true))

  const [hoursSum] = await db
    .select({ total: sum(eventParticipation.approvedHours) })
    .from(eventParticipation)
    .where(eq(eventParticipation.approvalStatus, 'approved'))

  const [ongoingCount] = await db
    .select({ count: count() })
    .from(events)
    .where(and(eq(events.isActive, true), eq(events.eventStatus, 'ongoing')))

  return {
    totalEvents: eventsCount?.count ?? 0,
    activeVolunteers: volunteersCount?.count ?? 0,
    totalHours: Number(hoursSum?.total) || 0,
    ongoingProjects: ongoingCount?.count ?? 0,
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

  return result as unknown[] as {
    month: string
    month_number: number
    year_number: number
    events_count: number
    volunteers_count: number
    hours_sum: number
  }[]
}
