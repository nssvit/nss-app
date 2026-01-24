/**
 * Drizzle ORM Type-Safe Queries
 *
 * This module provides type-safe database queries using Drizzle ORM.
 * These queries are for SERVER-SIDE USE ONLY (API routes, server actions).
 *
 * These queries can replace many of the RPC functions with better type safety.
 *
 * IMPORTANT:
 * - These bypass RLS, so authorization must be checked in application code
 * - For admin operations that need SECURITY DEFINER, keep using RPC functions
 * - For client-side queries that rely on RLS, use Supabase client
 *
 * Usage:
 * ```typescript
 * // In an API route or server action
 * import { queries } from '@/db/queries'
 *
 * export async function GET() {
 *   const stats = await queries.getDashboardStats()
 *   return Response.json(stats)
 * }
 * ```
 */

import { db } from './index'
import { eq, and, or, sql, desc, asc, count, sum, gte, lte, inArray, ne } from 'drizzle-orm'
import {
  volunteers,
  events,
  eventParticipation,
  eventCategories,
  userRoles,
  roleDefinitions,
  type Volunteer,
  type Event,
  type EventParticipation,
  type NewEventParticipation,
  type UserRole,
  type NewUserRole,
} from './schema'

// ============================================================================
// Dashboard Statistics
// ============================================================================

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

// ============================================================================
// Volunteer Queries
// ============================================================================

/**
 * Get all volunteers with participation statistics
 * Replaces: get_volunteers_with_stats RPC function
 *
 * Note: This bypasses RLS. For operations respecting RLS, use Supabase client.
 */
export async function getVolunteersWithStats() {
  const result = await db.execute(sql`
    SELECT
      v.id,
      v.id as volunteer_id,
      v.auth_user_id,
      v.first_name,
      v.last_name,
      v.roll_number,
      v.email,
      v.branch,
      v.year,
      v.phone_no,
      v.birth_date,
      v.gender,
      v.nss_join_year,
      v.address,
      v.profile_pic,
      v.is_active,
      v.created_at,
      v.updated_at,
      COALESCE(COUNT(DISTINCT ep.event_id), 0)::int as events_participated,
      COALESCE(SUM(ep.approved_hours), 0)::int as total_hours
    FROM volunteers v
    LEFT JOIN event_participation ep ON v.id = ep.volunteer_id
      AND ep.approval_status = 'approved'
    WHERE v.is_active = true
    GROUP BY v.id
    ORDER BY v.created_at DESC
  `)

  return result as unknown[]
}

/**
 * Get a single volunteer by ID with full details
 */
export async function getVolunteerById(volunteerId: string) {
  const result = await db.query.volunteers.findFirst({
    where: eq(volunteers.id, volunteerId),
    with: {
      assignedRoles: {
        with: {
          roleDefinition: true,
        },
      },
      participations: {
        with: {
          event: {
            with: {
              category: true,
            },
          },
        },
      },
    },
  })

  return result
}

/**
 * Get volunteer by auth user ID
 */
export async function getVolunteerByAuthId(authUserId: string) {
  const result = await db.query.volunteers.findFirst({
    where: eq(volunteers.authUserId, authUserId),
    with: {
      assignedRoles: {
        where: eq(userRoles.isActive, true),
        with: {
          roleDefinition: true,
        },
      },
    },
  })

  return result
}

// ============================================================================
// Event Queries
// ============================================================================

/**
 * Get all events with statistics
 * Replaces: get_events_with_stats RPC function
 */
export async function getEventsWithStats() {
  const result = await db.execute(sql`
    SELECT
      e.id,
      e.event_name,
      e.description,
      e.start_date,
      e.end_date,
      e.event_date,
      e.location,
      e.max_participants,
      e.min_participants,
      e.registration_deadline,
      e.event_status,
      e.category_id,
      e.created_by_volunteer_id,
      e.is_active,
      e.created_at,
      e.updated_at,
      COALESCE(COUNT(DISTINCT ep.volunteer_id), 0)::int as participant_count,
      COALESCE(SUM(ep.approved_hours), 0)::int as total_hours,
      ec.category_name,
      ec.color_hex as category_color
    FROM events e
    LEFT JOIN event_participation ep ON e.id = ep.event_id
    LEFT JOIN event_categories ec ON e.category_id = ec.id
    WHERE e.is_active = true
    GROUP BY e.id, ec.category_name, ec.color_hex
    ORDER BY e.created_at DESC
  `)

  return result as unknown[]
}

/**
 * Get a single event by ID with full details
 */
export async function getEventById(eventId: string) {
  const result = await db.query.events.findFirst({
    where: eq(events.id, eventId),
    with: {
      category: true,
      createdBy: true,
      participations: {
        with: {
          volunteer: true,
        },
      },
    },
  })

  return result
}

/**
 * Get upcoming events
 */
export async function getUpcomingEvents(limit: number = 10) {
  const result = await db.query.events.findMany({
    where: and(eq(events.isActive, true), gte(events.startDate, sql`CURRENT_DATE`)),
    with: {
      category: true,
      createdBy: true,
    },
    orderBy: [events.startDate],
    limit,
  })

  return result
}

// ============================================================================
// Reports & Analytics
// ============================================================================

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

  return result as unknown[] as {
    category_id: number
    category_name: string
    event_count: number
    color_hex: string
    participant_count: number
    total_hours: number
  }[]
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
      e.event_date,
      ec.category_name,
      COALESCE(COUNT(DISTINCT ep.volunteer_id), 0)::int as participant_count,
      COALESCE(SUM(ep.approved_hours), 0)::int as total_hours,
      (COALESCE(COUNT(DISTINCT ep.volunteer_id), 0) * COALESCE(SUM(ep.approved_hours), 0))::text as impact_score,
      e.event_status
    FROM events e
    LEFT JOIN event_categories ec ON e.category_id = ec.id
    LEFT JOIN event_participation ep ON e.id = ep.event_id
    WHERE e.is_active = true
    GROUP BY e.id, e.event_name, e.event_date, ec.category_name, e.event_status
    ORDER BY (COALESCE(COUNT(DISTINCT ep.volunteer_id), 0) * COALESCE(SUM(ep.approved_hours), 0)) DESC
    LIMIT ${limitCount}
  `)

  return result as unknown[] as {
    event_id: string
    event_name: string
    event_date: string | null
    category_name: string
    participant_count: number
    total_hours: number
    impact_score: string
    event_status: string
  }[]
}

/**
 * Get pending approvals count
 * Replaces: get_pending_approvals_count RPC function
 */
export async function getPendingApprovalsCount() {
  const [result] = await db
    .select({ count: count() })
    .from(eventParticipation)
    .where(
      and(
        eq(eventParticipation.approvalStatus, 'pending'),
        sql`${eventParticipation.hoursAttended} > 0`
      )
    )

  return result?.count ?? 0
}

// ============================================================================
// Hours Approval (Read-only queries - mutations should use RPC for transactions)
// ============================================================================

/**
 * Get participations pending approval
 */
export async function getPendingParticipations() {
  const result = await db.query.eventParticipation.findMany({
    where: and(
      eq(eventParticipation.approvalStatus, 'pending'),
      sql`${eventParticipation.hoursAttended} > 0`
    ),
    with: {
      volunteer: true,
      event: {
        with: {
          category: true,
        },
      },
    },
    orderBy: [desc(eventParticipation.createdAt)],
  })

  return result
}

// ============================================================================
// Role Queries
// ============================================================================

/**
 * Get all active roles for a volunteer
 */
export async function getVolunteerRoles(volunteerId: string) {
  const result = await db.query.userRoles.findMany({
    where: and(eq(userRoles.volunteerId, volunteerId), eq(userRoles.isActive, true)),
    with: {
      roleDefinition: true,
    },
  })

  return result
}

/**
 * Check if a volunteer has a specific role
 */
export async function volunteerHasRole(volunteerId: string, roleName: string): Promise<boolean> {
  const result = await db
    .select({ count: count() })
    .from(userRoles)
    .innerJoin(roleDefinitions, eq(userRoles.roleDefinitionId, roleDefinitions.id))
    .where(
      and(
        eq(userRoles.volunteerId, volunteerId),
        eq(userRoles.isActive, true),
        eq(roleDefinitions.roleName, roleName),
        eq(roleDefinitions.isActive, true)
      )
    )

  return (result[0]?.count ?? 0) > 0
}

/**
 * Check if a volunteer has any of the specified roles
 * Replaces: has_any_role RPC function (server-side version)
 */
export async function volunteerHasAnyRole(
  volunteerId: string,
  roleNames: string[]
): Promise<boolean> {
  const result = await db
    .select({ count: count() })
    .from(userRoles)
    .innerJoin(roleDefinitions, eq(userRoles.roleDefinitionId, roleDefinitions.id))
    .where(
      and(
        eq(userRoles.volunteerId, volunteerId),
        eq(userRoles.isActive, true),
        inArray(roleDefinitions.roleName, roleNames),
        eq(roleDefinitions.isActive, true)
      )
    )

  return (result[0]?.count ?? 0) > 0
}

/**
 * Check if a volunteer is an admin
 * Replaces: is_admin RPC function (server-side version)
 */
export async function isVolunteerAdmin(volunteerId: string): Promise<boolean> {
  return volunteerHasRole(volunteerId, 'admin')
}

/**
 * Get all role definitions
 */
export async function getAllRoles() {
  return await db.query.roleDefinitions.findMany({
    where: eq(roleDefinitions.isActive, true),
    orderBy: [asc(roleDefinitions.hierarchyLevel)],
  })
}

// ============================================================================
// Hours Approval Transactions
// ============================================================================

/**
 * Approve hours for a participation
 * Replaces: approve_hours RPC function
 */
export async function approveHoursTransaction(
  participationId: string,
  approvedBy: string,
  approvedHours?: number | null,
  notes?: string | null
) {
  return await db.transaction(async (tx) => {
    // Get current participation
    const [participation] = await tx
      .select()
      .from(eventParticipation)
      .where(eq(eventParticipation.id, participationId))

    if (!participation) {
      throw new Error('Participation not found')
    }

    // Update participation
    await tx
      .update(eventParticipation)
      .set({
        approvalStatus: 'approved',
        approvedBy,
        approvedAt: new Date(),
        approvedHours: approvedHours ?? participation.hoursAttended,
        approvalNotes: notes,
        updatedAt: new Date(),
      })
      .where(eq(eventParticipation.id, participationId))

    return { success: true }
  })
}

/**
 * Reject hours for a participation
 * Replaces: reject_hours RPC function
 */
export async function rejectHoursTransaction(
  participationId: string,
  rejectedBy: string,
  notes?: string | null
) {
  return await db.transaction(async (tx) => {
    // Get current participation
    const [participation] = await tx
      .select()
      .from(eventParticipation)
      .where(eq(eventParticipation.id, participationId))

    if (!participation) {
      throw new Error('Participation not found')
    }

    // Update participation
    await tx
      .update(eventParticipation)
      .set({
        approvalStatus: 'rejected',
        approvedBy: rejectedBy,
        approvedAt: new Date(),
        approvedHours: 0,
        approvalNotes: notes,
        updatedAt: new Date(),
      })
      .where(eq(eventParticipation.id, participationId))

    return { success: true }
  })
}

/**
 * Bulk approve hours for multiple participations
 * Replaces: bulk_approve_hours RPC function
 */
export async function bulkApproveHoursTransaction(
  participationIds: string[],
  approvedBy: string,
  notes?: string | null
) {
  if (participationIds.length === 0) {
    return { success: true, count: 0 }
  }

  return await db.transaction(async (tx) => {
    // Update all participations
    await tx
      .update(eventParticipation)
      .set({
        approvalStatus: 'approved',
        approvedBy,
        approvedAt: new Date(),
        approvalNotes: notes ?? 'Bulk approved',
        updatedAt: new Date(),
      })
      .where(
        and(
          inArray(eventParticipation.id, participationIds),
          eq(eventParticipation.approvalStatus, 'pending')
        )
      )

    return { success: true, count: participationIds.length }
  })
}

/**
 * Reset approval status back to pending
 */
export async function resetApprovalTransaction(participationId: string) {
  return await db.transaction(async (tx) => {
    await tx
      .update(eventParticipation)
      .set({
        approvalStatus: 'pending',
        approvedBy: null,
        approvedAt: null,
        approvedHours: null,
        approvalNotes: null,
        updatedAt: new Date(),
      })
      .where(eq(eventParticipation.id, participationId))

    return { success: true }
  })
}

// ============================================================================
// Attendance Operations
// ============================================================================

/**
 * Mark attendance for multiple volunteers at an event
 * Replaces: mark_event_attendance RPC function
 */
export async function markEventAttendance(
  eventId: string,
  volunteerIds: string[],
  declaredHours: number = 0,
  recordedBy?: string | null
) {
  if (volunteerIds.length === 0) {
    return { success: true, participantsAdded: 0, message: 'No volunteers to mark' }
  }

  return await db.transaction(async (tx) => {
    let addedCount = 0

    for (const volunteerId of volunteerIds) {
      // Check if participation already exists
      const [existing] = await tx
        .select()
        .from(eventParticipation)
        .where(
          and(
            eq(eventParticipation.eventId, eventId),
            eq(eventParticipation.volunteerId, volunteerId)
          )
        )

      if (existing) {
        // Update existing participation to present
        await tx
          .update(eventParticipation)
          .set({
            participationStatus: 'present',
            hoursAttended: declaredHours,
            attendanceDate: new Date(),
            recordedByVolunteerId: recordedBy,
            updatedAt: new Date(),
          })
          .where(eq(eventParticipation.id, existing.id))
      } else {
        // Create new participation
        await tx.insert(eventParticipation).values({
          eventId,
          volunteerId,
          participationStatus: 'present',
          hoursAttended: declaredHours,
          declaredHours,
          attendanceDate: new Date(),
          recordedByVolunteerId: recordedBy,
        })
        addedCount++
      }
    }

    return {
      success: true,
      participantsAdded: addedCount,
      message: `Marked attendance for ${volunteerIds.length} volunteers`,
    }
  })
}

/**
 * Update event attendance - sync participation list
 * Replaces: update_event_attendance RPC function
 */
export async function updateEventAttendance(
  eventId: string,
  volunteerIds: string[],
  recordedBy?: string | null
) {
  return await db.transaction(async (tx) => {
    // Get current participants
    const currentParticipants = await tx
      .select({ volunteerId: eventParticipation.volunteerId })
      .from(eventParticipation)
      .where(eq(eventParticipation.eventId, eventId))

    const currentIds = new Set(currentParticipants.map((p) => p.volunteerId))
    const newIds = new Set(volunteerIds)

    // Find volunteers to add and remove
    const toAdd = volunteerIds.filter((id) => !currentIds.has(id))
    const toRemove = [...currentIds].filter((id) => !newIds.has(id))

    // Remove participants no longer in the list
    if (toRemove.length > 0) {
      await tx
        .delete(eventParticipation)
        .where(
          and(
            eq(eventParticipation.eventId, eventId),
            inArray(eventParticipation.volunteerId, toRemove)
          )
        )
    }

    // Add new participants
    if (toAdd.length > 0) {
      await tx.insert(eventParticipation).values(
        toAdd.map((volunteerId) => ({
          eventId,
          volunteerId,
          participationStatus: 'present' as const,
          hoursAttended: 0,
          recordedByVolunteerId: recordedBy,
        }))
      )
    }

    return {
      success: true,
      added: toAdd.length,
      removed: toRemove.length,
      totalPresent: volunteerIds.length,
      message: `Updated attendance: added ${toAdd.length}, removed ${toRemove.length}`,
    }
  })
}

/**
 * Sync event attendance - replace all with selected volunteers
 * Replaces: sync_event_attendance RPC function
 */
export async function syncEventAttendance(eventId: string, selectedVolunteerIds: string[]) {
  return await db.transaction(async (tx) => {
    // Remove all current participants not in the new list
    const result = await tx.delete(eventParticipation).where(
      and(
        eq(eventParticipation.eventId, eventId),
        selectedVolunteerIds.length > 0
          ? sql`${eventParticipation.volunteerId} NOT IN (${sql.join(
              selectedVolunteerIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          : sql`true`
      )
    )

    return {
      removedCount: 0, // Note: Drizzle doesn't return affected rows count easily
      message: 'Synced event attendance',
    }
  })
}

/**
 * Register a volunteer for an event
 * Replaces: register_for_event RPC function (server-side version)
 */
export async function registerForEvent(
  eventId: string,
  volunteerId: string,
  declaredHours: number = 0
) {
  return await db.transaction(async (tx) => {
    // Check if already registered
    const [existing] = await tx
      .select()
      .from(eventParticipation)
      .where(
        and(
          eq(eventParticipation.eventId, eventId),
          eq(eventParticipation.volunteerId, volunteerId)
        )
      )

    if (existing) {
      throw new Error('Already registered for this event')
    }

    // Check event capacity
    const [event] = await tx.select().from(events).where(eq(events.id, eventId))

    if (!event) {
      throw new Error('Event not found')
    }

    if (event.maxParticipants) {
      const [{ count: currentCount }] = await tx
        .select({ count: count() })
        .from(eventParticipation)
        .where(eq(eventParticipation.eventId, eventId))

      if (currentCount >= event.maxParticipants) {
        throw new Error('Event is at full capacity')
      }
    }

    // Register
    await tx.insert(eventParticipation).values({
      eventId,
      volunteerId,
      participationStatus: 'registered',
      declaredHours,
      registrationDate: new Date(),
    })

    return { success: true }
  })
}

/**
 * Get event participants with details
 * Replaces: get_event_participants RPC function
 */
export async function getEventParticipants(eventId: string) {
  const result = await db.execute(sql`
    SELECT
      ep.id as participant_id,
      ep.volunteer_id,
      CONCAT(v.first_name, ' ', v.last_name) as volunteer_name,
      v.roll_number,
      v.branch,
      v.year,
      ep.participation_status,
      ep.hours_attended,
      ep.attendance_date,
      ep.registration_date,
      ep.notes
    FROM event_participation ep
    JOIN volunteers v ON ep.volunteer_id = v.id
    WHERE ep.event_id = ${eventId}
    ORDER BY v.first_name, v.last_name
  `)

  return result as unknown[] as {
    participant_id: string
    volunteer_id: string
    volunteer_name: string
    roll_number: string
    branch: string
    year: string
    participation_status: string
    hours_attended: number
    attendance_date: Date | null
    registration_date: Date
    notes: string | null
  }[]
}

// ============================================================================
// Admin Operations
// ============================================================================

/**
 * Admin: Get all volunteers (bypasses RLS)
 * Replaces: admin_get_all_volunteers RPC function
 */
export async function adminGetAllVolunteers() {
  return await getVolunteersWithStats()
}

/**
 * Admin: Update volunteer
 * Replaces: admin_update_volunteer RPC function
 */
export async function adminUpdateVolunteer(volunteerId: string, updates: Partial<Volunteer>) {
  return await db.transaction(async (tx) => {
    const [volunteer] = await tx.select().from(volunteers).where(eq(volunteers.id, volunteerId))

    if (!volunteer) {
      throw new Error('Volunteer not found')
    }

    await tx
      .update(volunteers)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(volunteers.id, volunteerId))

    return { success: true }
  })
}

/**
 * Admin: Assign role to volunteer
 * Replaces: admin_assign_role RPC function
 */
export async function adminAssignRole(
  volunteerId: string,
  roleDefinitionId: string,
  assignedBy: string,
  expiresAt?: Date | null
) {
  return await db.transaction(async (tx) => {
    // Check if role is already assigned
    const [existing] = await tx
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.volunteerId, volunteerId),
          eq(userRoles.roleDefinitionId, roleDefinitionId),
          eq(userRoles.isActive, true)
        )
      )

    if (existing) {
      throw new Error('Role already assigned to this volunteer')
    }

    // Assign role
    await tx.insert(userRoles).values({
      volunteerId,
      roleDefinitionId,
      assignedBy,
      expiresAt,
    })

    return { success: true }
  })
}

/**
 * Admin: Revoke role from volunteer
 * Replaces: admin_revoke_role RPC function
 */
export async function adminRevokeRole(volunteerId: string, roleDefinitionId: string) {
  return await db.transaction(async (tx) => {
    await tx
      .update(userRoles)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userRoles.volunteerId, volunteerId),
          eq(userRoles.roleDefinitionId, roleDefinitionId),
          eq(userRoles.isActive, true)
        )
      )

    return { success: true }
  })
}

// ============================================================================
// Event Operations
// ============================================================================

/**
 * Create event (server-side version)
 * Replaces: create_event RPC function
 */
export async function createEvent(
  eventData: {
    eventName: string
    description?: string | null
    eventDate?: Date | null
    startDate: string
    endDate: string
    declaredHours: number
    categoryId: number
    location?: string | null
    maxParticipants?: number | null
    minParticipants?: number | null
    registrationDeadline?: Date | null
    eventStatus?: string
  },
  createdByVolunteerId: string
) {
  return await db.transaction(async (tx) => {
    const [newEvent] = await tx
      .insert(events)
      .values({
        eventName: eventData.eventName,
        description: eventData.description,
        eventDate: eventData.eventDate,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        declaredHours: eventData.declaredHours,
        categoryId: eventData.categoryId,
        location: eventData.location,
        maxParticipants: eventData.maxParticipants,
        minParticipants: eventData.minParticipants,
        registrationDeadline: eventData.registrationDeadline,
        eventStatus: eventData.eventStatus ?? 'planned',
        createdByVolunteerId,
        isActive: true,
      })
      .returning()

    return { success: true, eventId: newEvent.id }
  })
}

/**
 * Update event
 */
export async function updateEvent(eventId: string, updates: Partial<Event>) {
  return await db.transaction(async (tx) => {
    await tx
      .update(events)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId))

    return { success: true }
  })
}

/**
 * Soft delete event
 */
export async function deleteEvent(eventId: string) {
  return await db.transaction(async (tx) => {
    await tx
      .update(events)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId))

    return { success: true }
  })
}

/**
 * Check if a volunteer can register for an event
 * Replaces: can_register_for_event RPC function
 */
export async function canRegisterForEvent(eventId: string, volunteerId?: string): Promise<boolean> {
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.isActive, true)))

  if (!event) {
    return false
  }

  // Check event status
  if (!['planned', 'registration_open'].includes(event.eventStatus)) {
    return false
  }

  // Check registration deadline
  if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) {
    return false
  }

  // Check capacity
  if (event.maxParticipants) {
    const [{ count: currentCount }] = await db
      .select({ count: count() })
      .from(eventParticipation)
      .where(eq(eventParticipation.eventId, eventId))

    if (currentCount >= event.maxParticipants) {
      return false
    }
  }

  // If volunteerId provided, check if already registered
  if (volunteerId) {
    const [existing] = await db
      .select()
      .from(eventParticipation)
      .where(
        and(
          eq(eventParticipation.eventId, eventId),
          eq(eventParticipation.volunteerId, volunteerId)
        )
      )

    if (existing) {
      return false
    }
  }

  return true
}

// ============================================================================
// Additional Report Queries
// ============================================================================

/**
 * Get attendance summary
 * Replaces: get_attendance_summary RPC function
 */
export async function getAttendanceSummary() {
  const result = await db.execute(sql`
    SELECT
      e.id as event_id,
      e.event_name,
      e.event_date,
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
    GROUP BY e.id, e.event_name, e.event_date, ec.category_name
    ORDER BY e.event_date DESC
  `)

  return result as unknown[] as {
    event_id: string
    event_name: string
    event_date: Date | null
    category_name: string | null
    total_registered: number
    total_present: number
    total_absent: number
    attendance_rate: number
    total_hours: number
  }[]
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

  return result as unknown[] as {
    volunteer_id: string
    volunteer_name: string
    total_hours: number
    approved_hours: number
    events_count: number
    last_activity: Date | null
  }[]
}

/**
 * Get volunteer participation history
 * Replaces: get_volunteer_participation_history RPC function
 */
export async function getVolunteerParticipationHistory(volunteerId: string) {
  const result = await db.execute(sql`
    SELECT
      e.id as event_id,
      e.event_name,
      e.event_date,
      ec.category_name,
      ep.participation_status,
      ep.hours_attended,
      ep.attendance_date
    FROM event_participation ep
    JOIN events e ON ep.event_id = e.id
    LEFT JOIN event_categories ec ON e.category_id = ec.id
    WHERE ep.volunteer_id = ${volunteerId}
    ORDER BY e.event_date DESC
  `)

  return result as unknown[] as {
    event_id: string
    event_name: string
    event_date: Date | null
    category_name: string | null
    participation_status: string
    hours_attended: number
    attendance_date: Date | null
  }[]
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
    total_users: totalUsers?.count ?? 0,
    active_users: activeUsers?.count ?? 0,
    pending_users: pendingUsers?.count ?? 0,
    admin_count: adminCount?.count ?? 0,
  }
}

// ============================================================================
// Additional Attendance Queries
// ============================================================================

/**
 * Update individual participation status
 */
export async function updateParticipationStatus(
  participantId: string,
  updates: {
    participationStatus?: string
    hoursAttended?: number
    notes?: string
  }
) {
  const [result] = await db
    .update(eventParticipation)
    .set({
      participationStatus: updates.participationStatus,
      hoursAttended: updates.hoursAttended,
      notes: updates.notes,
      updatedAt: new Date(),
    })
    .where(eq(eventParticipation.id, participantId))
    .returning()

  return result
}

/**
 * Bulk mark attendance with specific status
 */
export async function bulkMarkAttendance(params: {
  eventId: string
  volunteerIds: string[]
  status: string
  hoursAttended?: number
  notes?: string
  recordedBy: string
}) {
  const { eventId, volunteerIds, status, hoursAttended, notes, recordedBy } = params

  let updatedCount = 0

  for (const volunteerId of volunteerIds) {
    // Check if participation exists
    const existing = await db.query.eventParticipation.findFirst({
      where: and(
        eq(eventParticipation.eventId, eventId),
        eq(eventParticipation.volunteerId, volunteerId)
      ),
    })

    if (existing) {
      // Update existing
      await db
        .update(eventParticipation)
        .set({
          participationStatus: status,
          hoursAttended: hoursAttended ?? existing.hoursAttended,
          notes: notes ?? existing.notes,
          attendanceDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(eventParticipation.id, existing.id))
      updatedCount++
    } else {
      // Insert new
      await db.insert(eventParticipation).values({
        eventId,
        volunteerId,
        participationStatus: status,
        hoursAttended: hoursAttended ?? 0,
        declaredHours: hoursAttended ?? 0,
        notes,
        registrationDate: new Date(),
        attendanceDate: new Date(),
        recordedByVolunteerId: recordedBy,
      })
      updatedCount++
    }
  }

  return { count: updatedCount, error: null }
}

/**
 * Get events for attendance manager
 */
export async function getEventsForAttendance(limit: number = 50) {
  const result = await db.execute(sql`
    SELECT
      e.id,
      e.event_name,
      e.start_date as event_date,
      e.declared_hours,
      e.location
    FROM events e
    ORDER BY e.start_date DESC
    LIMIT ${limit}
  `)

  return result as unknown[] as {
    id: string
    event_name: string
    event_date: string
    declared_hours: number
    location: string | null
  }[]
}

// ============================================================================
// Export all queries as a namespace
// ============================================================================

export const queries = {
  // Dashboard
  getDashboardStats,
  getMonthlyActivityTrends,

  // Volunteers
  getVolunteersWithStats,
  getVolunteerById,
  getVolunteerByAuthId,

  // Events
  getEventsWithStats,
  getEventById,
  getUpcomingEvents,
  getEventParticipants,
  createEvent,
  updateEvent,
  deleteEvent,
  canRegisterForEvent,
  registerForEvent,

  // Reports
  getCategoryDistribution,
  getTopEventsByImpact,
  getPendingApprovalsCount,
  getAttendanceSummary,
  getVolunteerHoursSummary,
  getVolunteerParticipationHistory,
  getUserStats,

  // Hours Approval
  getPendingParticipations,
  approveHoursTransaction,
  rejectHoursTransaction,
  bulkApproveHoursTransaction,
  resetApprovalTransaction,

  // Attendance
  markEventAttendance,
  updateEventAttendance,
  syncEventAttendance,
  updateParticipationStatus,
  bulkMarkAttendance,
  getEventsForAttendance,

  // Roles
  getVolunteerRoles,
  volunteerHasRole,
  volunteerHasAnyRole,
  isVolunteerAdmin,
  getAllRoles,

  // Admin
  adminGetAllVolunteers,
  adminUpdateVolunteer,
  adminAssignRole,
  adminRevokeRole,
}

export default queries
