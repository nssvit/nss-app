'use server'

import { queries } from '@/db/queries'
import { createClient } from '@/utils/supabase/server'
import { db } from '@/db'
import { sql, count, sum, eq, and, gte, lte } from 'drizzle-orm'
import { volunteers, events, eventParticipation, eventCategories } from '@/db/schema'

/**
 * Auth helper - ensures user is authenticated
 * Throws if not authenticated
 */
async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized: Please sign in')
  }

  return user
}

/**
 * Get current volunteer for authenticated user
 */
async function getCurrentVolunteer() {
  const user = await requireAuth()
  const volunteer = await queries.getVolunteerByAuthId(user.id)
  if (!volunteer) {
    throw new Error('Volunteer profile not found')
  }
  return volunteer
}

/**
 * Get dashboard statistics
 * Returns: totalEvents, activeVolunteers, totalHours, ongoingProjects
 */
export async function getDashboardStats() {
  await requireAuth()
  return queries.getDashboardStats()
}

/**
 * Get monthly activity trends for charts
 * Returns last 12 months of activity data
 */
export async function getMonthlyTrends() {
  await requireAuth()
  return queries.getMonthlyActivityTrends()
}

/**
 * Get count of pending hour approvals
 */
export async function getPendingApprovalsCount() {
  await requireAuth()
  return queries.getPendingApprovalsCount()
}

/**
 * Get user statistics
 * Returns: totalUsers, activeUsers, pendingUsers, adminCount
 */
export async function getUserStats() {
  await requireAuth()
  return queries.getUserStats()
}

/**
 * Get admin dashboard stats (extended version)
 * Includes: all basic stats + pending reviews + active events + monthly stats
 */
export async function getAdminDashboardStats() {
  await requireAuth()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Basic stats
  const [volunteersCount] = await db
    .select({ count: count() })
    .from(volunteers)
    .where(eq(volunteers.isActive, true))

  const [eventsCount] = await db
    .select({ count: count() })
    .from(events)

  const [hoursSum] = await db
    .select({ total: sum(eventParticipation.approvedHours) })
    .from(eventParticipation)
    .where(eq(eventParticipation.approvalStatus, 'approved'))

  const [pendingCount] = await db
    .select({ count: count() })
    .from(eventParticipation)
    .where(and(
      eq(eventParticipation.approvalStatus, 'pending'),
      sql`${eventParticipation.hoursAttended} > 0`
    ))

  const [activeEventsCount] = await db
    .select({ count: count() })
    .from(events)
    .where(and(
      eq(events.isActive, true),
      gte(events.startDate, now.toISOString())
    ))

  // Monthly stats
  const [monthlyEventsCount] = await db
    .select({ count: count() })
    .from(events)
    .where(gte(events.createdAt, startOfMonth))

  const [monthlyVolunteersCount] = await db
    .select({ count: count() })
    .from(volunteers)
    .where(gte(volunteers.createdAt, startOfMonth))

  const [monthlyHoursSum] = await db
    .select({ total: sum(eventParticipation.approvedHours) })
    .from(eventParticipation)
    .where(and(
      eq(eventParticipation.approvalStatus, 'approved'),
      gte(eventParticipation.createdAt, startOfMonth)
    ))

  // Events ending this week
  const [eventsEndingSoonCount] = await db
    .select({ count: count() })
    .from(events)
    .where(and(
      eq(events.isActive, true),
      gte(events.endDate, now.toISOString()),
      lte(events.endDate, endOfWeek.toISOString())
    ))

  return {
    stats: {
      totalVolunteers: volunteersCount?.count ?? 0,
      totalEvents: eventsCount?.count ?? 0,
      totalHours: Number(hoursSum?.total) || 0,
      pendingReviews: pendingCount?.count ?? 0,
      activeEvents: activeEventsCount?.count ?? 0,
    },
    monthlyStats: {
      hoursLogged: Number(monthlyHoursSum?.total) || 0,
      eventsCreated: monthlyEventsCount?.count ?? 0,
      newVolunteers: monthlyVolunteersCount?.count ?? 0,
    },
    alerts: {
      pendingReviews: pendingCount?.count ?? 0,
      eventsEndingSoon: eventsEndingSoonCount?.count ?? 0,
      newRegistrations: monthlyVolunteersCount?.count ?? 0,
    },
  }
}

/**
 * Get recent events for admin dashboard
 */
export async function getRecentEvents(limit: number = 6) {
  await requireAuth()

  const result = await db.execute(sql`
    SELECT
      e.id,
      e.event_name,
      e.description as event_description,
      e.start_date,
      e.event_date,
      e.declared_hours,
      e.is_active,
      e.created_at,
      ec.category_name,
      ec.color_hex,
      v.first_name as creator_first_name,
      v.last_name as creator_last_name,
      COALESCE(COUNT(DISTINCT ep.volunteer_id), 0)::int as participant_count
    FROM events e
    LEFT JOIN event_categories ec ON e.category_id = ec.id
    LEFT JOIN volunteers v ON e.created_by_volunteer_id = v.id
    LEFT JOIN event_participation ep ON e.id = ep.event_id
    GROUP BY e.id, ec.category_name, ec.color_hex, v.first_name, v.last_name
    ORDER BY e.created_at DESC
    LIMIT ${limit}
  `)

  return (result as any).rows || result
}

/**
 * Get heads dashboard stats (events created by current user)
 */
export async function getHeadsDashboardStats() {
  const volunteer = await getCurrentVolunteer()

  // Get events created by this head
  const result = await db.execute(sql`
    SELECT
      e.id,
      e.event_name,
      e.description as event_description,
      e.start_date,
      e.event_date,
      e.declared_hours,
      e.is_active,
      e.created_at,
      ec.category_name,
      COALESCE(COUNT(DISTINCT ep.volunteer_id), 0)::int as participant_count,
      COALESCE(SUM(ep.approved_hours), 0)::int as total_hours
    FROM events e
    LEFT JOIN event_categories ec ON e.category_id = ec.id
    LEFT JOIN event_participation ep ON e.id = ep.event_id
    WHERE e.created_by_volunteer_id = ${volunteer.id}
    GROUP BY e.id, ec.category_name
    ORDER BY e.created_at DESC
  `)

  const myEvents = ((result as any).rows || result) as any[]

  // Calculate stats
  const totalParticipants = myEvents.reduce((sum, event) => sum + (event.participant_count || 0), 0)
  const hoursManaged = myEvents.reduce((sum, event) => sum + (event.total_hours || 0), 0)
  const activeEvents = myEvents.filter(event => {
    const eventDate = new Date(event.event_date || event.start_date)
    return event.is_active && eventDate >= new Date()
  }).length

  return {
    stats: {
      myEvents: myEvents.length,
      totalParticipants,
      hoursManaged,
      activeEvents,
    },
    events: myEvents,
  }
}

/**
 * Get volunteer hours summary (top volunteers by hours)
 */
export async function getVolunteerHoursSummary(limit: number = 10) {
  await requireAuth()
  return queries.getVolunteerHoursSummary().then(rows => rows.slice(0, limit))
}
