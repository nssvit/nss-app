/**
 * Reports & Analytics Queries
 * Provides reporting and analytics database operations
 */

import { eq, and, sql, count } from 'drizzle-orm'
import {
  parseRows,
  categoryDistributionRowSchema,
  topEventRowSchema,
  attendanceSummaryRowSchema,
  volunteerHoursSummaryRowSchema,
  participationHistoryRowSchema,
} from '../query-validators'
import { db } from '../index'
import { volunteers, userRoles, roleDefinitions } from '../schema'

/**
 * Get category distribution for reports
 * Replaces: get_category_distribution RPC function
 */
export async function getCategoryDistribution() {
  const result = await db.execute(sql`
    SELECT
      ec.id as category_id,
      ec.category_name,
      COALESCE(COUNT(DISTINCT e.id), 0)::int as event_count,
      ec.color_hex,
      COALESCE(COUNT(DISTINCT ep.volunteer_id), 0)::int as participant_count,
      COALESCE(SUM(ep.approved_hours), 0)::int as total_hours
    FROM event_categories ec
    LEFT JOIN events e ON ec.id = e.category_id AND e.is_active = true
    LEFT JOIN event_participation ep ON e.id = ep.event_id
    WHERE ec.is_active = true
    GROUP BY ec.id, ec.category_name, ec.color_hex
    ORDER BY event_count DESC
  `)

  return parseRows(result, categoryDistributionRowSchema)
}

/**
 * Get top events by impact score
 * Replaces: get_top_events_by_impact RPC function
 */
export async function getTopEventsByImpact(limitCount: number = 10) {
  const result = await db.execute(sql`
    SELECT
      e.id as event_id,
      e.event_name,
      e.start_date,
      ec.category_name,
      COALESCE(COUNT(DISTINCT ep.volunteer_id), 0)::int as participant_count,
      COALESCE(SUM(ep.approved_hours), 0)::int as total_hours,
      (COALESCE(COUNT(DISTINCT ep.volunteer_id), 0) * COALESCE(SUM(ep.approved_hours), 0))::text as impact_score,
      e.event_status
    FROM events e
    LEFT JOIN event_categories ec ON e.category_id = ec.id
    LEFT JOIN event_participation ep ON e.id = ep.event_id
    WHERE e.is_active = true
    GROUP BY e.id, e.event_name, e.start_date, ec.category_name, e.event_status
    ORDER BY (COALESCE(COUNT(DISTINCT ep.volunteer_id), 0) * COALESCE(SUM(ep.approved_hours), 0)) DESC
    LIMIT ${limitCount}
  `)

  return parseRows(result, topEventRowSchema)
}

/**
 * Get attendance summary
 * Replaces: get_attendance_summary RPC function
 */
export async function getAttendanceSummary() {
  const result = await db.execute(sql`
    SELECT
      e.id as event_id,
      e.event_name,
      e.start_date,
      ec.category_name,
      COUNT(ep.id) as total_registered,
      COUNT(CASE WHEN ep.participation_status IN ('present', 'partially_present') THEN 1 END) as total_present,
      COUNT(CASE WHEN ep.participation_status = 'absent' THEN 1 END) as total_absent,
      CASE
        WHEN COUNT(ep.id) > 0 THEN
          ROUND((COUNT(CASE WHEN ep.participation_status IN ('present', 'partially_present') THEN 1 END)::numeric / COUNT(ep.id)::numeric) * 100, 2)
        ELSE 0
      END as attendance_rate,
      COALESCE(SUM(ep.hours_attended), 0) as total_hours
    FROM events e
    LEFT JOIN event_categories ec ON e.category_id = ec.id
    LEFT JOIN event_participation ep ON e.id = ep.event_id
    WHERE e.is_active = true
    GROUP BY e.id, e.event_name, e.start_date, ec.category_name
    ORDER BY e.start_date DESC
  `)

  return parseRows(result, attendanceSummaryRowSchema)
}

/**
 * Get volunteer hours summary
 * Replaces: get_volunteer_hours_summary RPC function
 */
export async function getVolunteerHoursSummary() {
  const result = await db.execute(sql`
    SELECT
      v.id as volunteer_id,
      CONCAT(v.first_name, ' ', v.last_name) as volunteer_name,
      COALESCE(SUM(ep.hours_attended), 0)::int as total_hours,
      COALESCE(SUM(CASE WHEN ep.approval_status = 'approved' THEN ep.approved_hours ELSE 0 END), 0)::int as approved_hours,
      COUNT(DISTINCT ep.event_id)::int as events_count,
      MAX(ep.attendance_date) as last_activity
    FROM volunteers v
    LEFT JOIN event_participation ep ON v.id = ep.volunteer_id
    WHERE v.is_active = true
    GROUP BY v.id, v.first_name, v.last_name
    ORDER BY total_hours DESC
  `)

  return parseRows(result, volunteerHoursSummaryRowSchema)
}

/**
 * Get volunteer participation history
 * Replaces: get_volunteer_participation_history RPC function
 */
export async function getVolunteerParticipationHistory(volunteerId: string) {
  const result = await db.execute(sql`
    SELECT
      ep.id as participation_id,
      e.id as event_id,
      e.event_name,
      e.start_date,
      ec.category_name,
      ep.participation_status,
      ep.hours_attended,
      ep.attendance_date,
      ep.registration_date,
      ep.notes,
      ep.approval_status,
      ep.approved_hours,
      ep.approved_by,
      ep.approved_at,
      ep.approval_notes,
      ep.created_at,
      ep.recorded_by_volunteer_id
    FROM event_participation ep
    JOIN events e ON ep.event_id = e.id
    LEFT JOIN event_categories ec ON e.category_id = ec.id
    WHERE ep.volunteer_id = ${volunteerId}
    ORDER BY e.start_date DESC
  `)

  return parseRows(result, participationHistoryRowSchema)
}

/**
 * Get user stats
 * Replaces: get_user_stats RPC function
 */
export async function getUserStats() {
  const [totalUsers] = await db.select({ count: count() }).from(volunteers)
  const [activeUsers] = await db
    .select({ count: count() })
    .from(volunteers)
    .where(eq(volunteers.isActive, true))
  const [pendingUsers] = await db
    .select({ count: count() })
    .from(volunteers)
    .where(eq(volunteers.isActive, false))

  // Count admins
  const [adminCount] = await db
    .select({ count: count() })
    .from(userRoles)
    .innerJoin(roleDefinitions, eq(userRoles.roleDefinitionId, roleDefinitions.id))
    .where(
      and(
        eq(roleDefinitions.roleName, 'admin'),
        eq(userRoles.isActive, true),
        eq(roleDefinitions.isActive, true)
      )
    )

  return {
    totalUsers: totalUsers?.count ?? 0,
    activeUsers: activeUsers?.count ?? 0,
    pendingUsers: pendingUsers?.count ?? 0,
    adminCount: adminCount?.count ?? 0,
  }
}
