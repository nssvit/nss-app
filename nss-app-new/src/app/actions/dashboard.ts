'use server'

import { sql, count, sum, eq, and, gte, lte } from 'drizzle-orm'
import { db } from '@/db'
import { queries } from '@/db/queries'
import { volunteers, events, eventParticipation } from '@/db/schema'
import { getAuthUser, getCurrentVolunteer as getCachedVolunteer } from '@/lib/auth-cache'

// Use cached auth helpers for better performance

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
  return queries.getMonthlyActivityTrends()
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

/**
 * Get admin dashboard stats (extended version)
 * Includes: all basic stats + pending reviews + active events + monthly stats
 * OPTIMIZED: All queries run in parallel for ~3x faster response
 */
export async function getAdminDashboardStats() {
  await getAuthUser() // Cached auth check

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Run ALL queries in parallel for maximum performance
  const [
    volunteersCount,
    eventsCount,
    hoursSum,
    pendingCount,
    activeEventsCount,
    monthlyEventsCount,
    monthlyVolunteersCount,
    monthlyHoursSum,
    eventsEndingSoonCount,
  ] = await Promise.all([
    // Basic stats
    db.select({ count: count() }).from(volunteers).where(eq(volunteers.isActive, true)),
    db.select({ count: count() }).from(events),
    db
      .select({ total: sum(eventParticipation.approvedHours) })
      .from(eventParticipation)
      .where(eq(eventParticipation.approvalStatus, 'approved')),
    db
      .select({ count: count() })
      .from(eventParticipation)
      .where(
        and(
          eq(eventParticipation.approvalStatus, 'pending'),
          sql`${eventParticipation.hoursAttended} > 0`
        )
      ),
    db
      .select({ count: count() })
      .from(events)
      .where(and(eq(events.isActive, true), gte(events.startDate, now.toISOString()))),
    // Monthly stats
    db.select({ count: count() }).from(events).where(gte(events.createdAt, startOfMonth)),
    db.select({ count: count() }).from(volunteers).where(gte(volunteers.createdAt, startOfMonth)),
    db
      .select({ total: sum(eventParticipation.approvedHours) })
      .from(eventParticipation)
      .where(
        and(
          eq(eventParticipation.approvalStatus, 'approved'),
          gte(eventParticipation.createdAt, startOfMonth)
        )
      ),
    // Events ending soon
    db
      .select({ count: count() })
      .from(events)
      .where(
        and(
          eq(events.isActive, true),
          gte(events.endDate, now.toISOString()),
          lte(events.endDate, endOfWeek.toISOString())
        )
      ),
  ])

  return {
    stats: {
      totalVolunteers: volunteersCount[0]?.count ?? 0,
      totalEvents: eventsCount[0]?.count ?? 0,
      totalHours: Number(hoursSum[0]?.total) || 0,
      pendingReviews: pendingCount[0]?.count ?? 0,
      activeEvents: activeEventsCount[0]?.count ?? 0,
    },
    monthlyStats: {
      hoursLogged: Number(monthlyHoursSum[0]?.total) || 0,
      eventsCreated: monthlyEventsCount[0]?.count ?? 0,
      newVolunteers: monthlyVolunteersCount[0]?.count ?? 0,
    },
    alerts: {
      pendingReviews: pendingCount[0]?.count ?? 0,
      eventsEndingSoon: eventsEndingSoonCount[0]?.count ?? 0,
      newRegistrations: monthlyVolunteersCount[0]?.count ?? 0,
    },
  }
}

/**
 * Get complete admin dashboard data in a single call
 * Combines stats and recent events to reduce round trips
 */
export async function getFullAdminDashboard(eventsLimit: number = 6) {
  await getAuthUser() // Cached auth check

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Run ALL queries in parallel including recent events
  const [
    volunteersCount,
    eventsCount,
    hoursSum,
    pendingCount,
    activeEventsCount,
    monthlyEventsCount,
    monthlyVolunteersCount,
    monthlyHoursSum,
    eventsEndingSoonCount,
    recentEventsResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(volunteers).where(eq(volunteers.isActive, true)),
    db.select({ count: count() }).from(events),
    db
      .select({ total: sum(eventParticipation.approvedHours) })
      .from(eventParticipation)
      .where(eq(eventParticipation.approvalStatus, 'approved')),
    db
      .select({ count: count() })
      .from(eventParticipation)
      .where(
        and(
          eq(eventParticipation.approvalStatus, 'pending'),
          sql`${eventParticipation.hoursAttended} > 0`
        )
      ),
    db
      .select({ count: count() })
      .from(events)
      .where(and(eq(events.isActive, true), gte(events.startDate, now.toISOString()))),
    db.select({ count: count() }).from(events).where(gte(events.createdAt, startOfMonth)),
    db.select({ count: count() }).from(volunteers).where(gte(volunteers.createdAt, startOfMonth)),
    db
      .select({ total: sum(eventParticipation.approvedHours) })
      .from(eventParticipation)
      .where(
        and(
          eq(eventParticipation.approvalStatus, 'approved'),
          gte(eventParticipation.createdAt, startOfMonth)
        )
      ),
    db
      .select({ count: count() })
      .from(events)
      .where(
        and(
          eq(events.isActive, true),
          gte(events.endDate, now.toISOString()),
          lte(events.endDate, endOfWeek.toISOString())
        )
      ),
    // Recent events query
    db.execute(sql`
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
      LIMIT ${eventsLimit}
    `),
  ])

  return {
    stats: {
      totalVolunteers: volunteersCount[0]?.count ?? 0,
      totalEvents: eventsCount[0]?.count ?? 0,
      totalHours: Number(hoursSum[0]?.total) || 0,
      pendingReviews: pendingCount[0]?.count ?? 0,
      activeEvents: activeEventsCount[0]?.count ?? 0,
    },
    monthlyStats: {
      hoursLogged: Number(monthlyHoursSum[0]?.total) || 0,
      eventsCreated: monthlyEventsCount[0]?.count ?? 0,
      newVolunteers: monthlyVolunteersCount[0]?.count ?? 0,
    },
    alerts: {
      pendingReviews: pendingCount[0]?.count ?? 0,
      eventsEndingSoon: eventsEndingSoonCount[0]?.count ?? 0,
      newRegistrations: monthlyVolunteersCount[0]?.count ?? 0,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw SQL result
    recentEvents: (recentEventsResult as any).rows || recentEventsResult,
  }
}

/**
 * Get recent events for admin dashboard
 */
export async function getRecentEvents(limit: number = 6) {
  await getAuthUser()

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw SQL result
  return (result as any).rows || result
}

/**
 * Get heads dashboard stats (events created by current user)
 */
export async function getHeadsDashboardStats() {
  const volunteer = await getCachedVolunteer()

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw SQL result
  const myEvents = ((result as any).rows || result) as any[]

  // Calculate stats
  const totalParticipants = myEvents.reduce((sum, event) => sum + (event.participant_count || 0), 0)
  const hoursManaged = myEvents.reduce((sum, event) => sum + (event.total_hours || 0), 0)
  const activeEvents = myEvents.filter((event) => {
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
  await getAuthUser()
  return queries.getVolunteerHoursSummary().then((rows) => rows.slice(0, limit))
}
