'use server'

import { sql, count, sum, eq, and, gte, lte } from 'drizzle-orm'
import { db } from '@/db'
import { volunteers, events, eventParticipation } from '@/db/schema'
import { getAuthUser } from '@/lib/auth-cache'

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
      .where(and(eq(events.isActive, true), gte(events.startDate, now))),
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
          gte(events.endDate, now),
          lte(events.endDate, endOfWeek)
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
      .where(and(eq(events.isActive, true), gte(events.startDate, now))),
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
          gte(events.endDate, now),
          lte(events.endDate, endOfWeek)
        )
      ),
    // Recent events query
    db.execute(sql`
      SELECT
        e.id,
        e.event_name,
        e.description as event_description,
        e.start_date,
        e.end_date,
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
      e.end_date,
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
