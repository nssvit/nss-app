'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { volunteers } from '@/db/schema'
import { queries } from '@/db/queries'
import type { Volunteer } from '@/db/schema'
import { getAuthUser, getCurrentVolunteer as getCachedVolunteer, requireAdmin } from '@/lib/auth-cache'
import { getCachedVolunteerHoursSummary } from '@/lib/query-cache'
import { mapVolunteerRow, mapParticipationRow, mapVolunteerHoursSummaryRow } from '@/lib/mappers'
import { logAudit } from '@/lib/audit'

/** Validation schema for creating a new volunteer manually (admin only) */
const adminCreateSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  rollNumber: z.string().min(1).max(20),
  email: z.string().email(),
  branch: z.enum(['EXCS', 'CMPN', 'IT', 'BIO-MED', 'EXTC']),
  year: z.enum(['FE', 'SE', 'TE']),
  phoneNo: z.string().regex(/^[0-9]{10}$/, 'Phone number must be 10 digits').optional().nullable(),
  nssJoinYear: z.number().int().min(2000).max(2100).optional().nullable(),
}).strict()

/** Validation schema for admin volunteer updates */
const adminUpdateSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  rollNumber: z.string().min(1).max(20).optional(),
  branch: z.enum(['EXCS', 'CMPN', 'IT', 'BIO-MED', 'EXTC']).optional(),
  year: z.enum(['FE', 'SE', 'TE']).optional(),
  phoneNo: z.string().regex(/^[0-9]{10}$/, 'Phone number must be 10 digits').optional().nullable(),
  gender: z.enum(['M', 'F', 'Prefer not to say']).optional().nullable(),
  birthDate: z.string().optional().nullable(),
  nssJoinYear: z.number().int().min(2000).max(2100).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  profilePic: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
}).strict()

/** Validation schema for self-profile updates */
const profileUpdateSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phoneNo: z.string().regex(/^[0-9]{10}$/, 'Phone number must be 10 digits').optional(),
  address: z.string().max(500).optional(),
  gender: z.enum(['M', 'F', 'Prefer not to say']).optional(),
  birthDate: z.string().optional(),
}).strict()

/**
 * Get all volunteers with participation stats
 * Maps snake_case DB rows to camelCase frontend types
 */
export async function getVolunteers() {
  await getAuthUser() // Cached auth check
  const rows = await queries.getVolunteersWithStats()
  return rows.map(mapVolunteerRow)
}

/**
 * Get a single volunteer by ID with roles and participations
 */
export async function getVolunteerById(volunteerId: string) {
  await getAuthUser()
  return queries.getVolunteerById(volunteerId)
}

/**
 * Get volunteer by their auth user ID
 */
export async function getVolunteerByAuthId(authUserId: string) {
  await getAuthUser()
  return queries.getVolunteerByAuthId(authUserId)
}

/**
 * Get current logged-in volunteer
 */
export async function getCurrentVolunteer() {
  return getCachedVolunteer()
}

/**
 * Update volunteer information (admin only)
 */
export async function updateVolunteer(
  volunteerId: string,
  updates: Partial<Omit<Volunteer, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const admin = await requireAdmin()
  const validated = adminUpdateSchema.parse(updates)
  const result = await queries.adminUpdateVolunteer(volunteerId, validated)
  logAudit({ action: 'volunteer.update', actorId: admin.id, targetType: 'volunteer', targetId: volunteerId, details: validated })
  revalidatePath('/volunteers')
  revalidatePath('/profile')
  return result
}

/**
 * Get volunteer participation history
 */
export async function getVolunteerParticipationHistory(volunteerId: string) {
  await getAuthUser()
  const rows = await queries.getVolunteerParticipationHistory(volunteerId)
  return rows.map((r) => mapParticipationRow(r, volunteerId))
}

/**
 * Get volunteer hours summary
 */
export async function getVolunteerHoursSummary() {
  await getAuthUser()
  const rows = await getCachedVolunteerHoursSummary()
  return rows.map(mapVolunteerHoursSummaryRow)
}

/**
 * Get current volunteer's approved hours total for the current tenure.
 * Lightweight — just one SUM. Drives the volunteer dashboard progress bar.
 */
export async function getMyHoursSummary() {
  const volunteer = await getCachedVolunteer()

  const rows = await db.execute(sql`
    SELECT COALESCE(SUM(approved_hours), 0)::int AS approved_hours
    FROM event_participation
    WHERE volunteer_id = ${volunteer.id}
      AND tenure_id = current_tenure_id()
      AND approval_status = 'approved'
  `)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw SQL
  const row = (Array.isArray(rows) ? rows[0] : null) as any
  return {
    approvedHours: Number(row?.approved_hours ?? 0),
  }
}

/**
 * Get current volunteer's profile with participation data
 * OPTIMIZED: Runs queries in parallel
 */
export async function getMyProfile() {
  const volunteer = await getCachedVolunteer()
  const rows = await queries.getVolunteerParticipationHistory(volunteer.id)

  return {
    volunteer,
    participation: rows.map((r) => mapParticipationRow(r, volunteer.id)),
  }
}

/**
 * Update current volunteer's profile
 */
export async function updateMyProfile(updates: {
  firstName?: string
  lastName?: string
  phoneNo?: string
  address?: string
  gender?: string
  birthDate?: string
}) {
  const volunteer = await getCachedVolunteer()
  const validated = profileUpdateSchema.parse(updates)

  const result = await queries.adminUpdateVolunteer(volunteer.id, {
    firstName: validated.firstName,
    lastName: validated.lastName,
    phoneNo: validated.phoneNo,
    address: validated.address,
    gender: validated.gender,
    birthDate: validated.birthDate,
  })

  revalidatePath('/profile')
  return result
}

/**
 * Get volunteer dashboard data (my participation + available events)
 * OPTIMIZED: Runs queries in parallel
 */
export async function getVolunteerDashboardData() {
  const volunteer = await getCachedVolunteer()

  // Run both queries in parallel
  const [participationHistoryRaw, upcomingEventsRaw] = await Promise.all([
    queries.getVolunteerParticipationHistory(volunteer.id),
    queries.getUpcomingEvents(10),
  ])

  // Ensure arrays are not undefined
  const rawHistory = participationHistoryRaw || []
  const upcomingEvents = upcomingEventsRaw || []

  // Calculate stats from raw snake_case rows BEFORE mapping
  /* eslint-disable @typescript-eslint/no-explicit-any -- raw SQL rows */
  const stats = {
    totalHours: rawHistory.reduce(
      (sum: number, p: any) => sum + (p.hours_attended ?? 0),
      0
    ),
    approvedHours: rawHistory
      .filter((p: any) => p.approval_status === 'approved')
      .reduce((sum: number, p: any) => sum + (p.approved_hours ?? p.hours_attended ?? 0), 0),
    eventsParticipated: rawHistory.length,
    pendingReviews: rawHistory.filter(
      (p: any) => p.approval_status === 'pending' && p.hours_attended > 0
    ).length,
  }

  // Filter out events already registered for
  const participatedEventIds = new Set(rawHistory.map((p: any) => p.event_id))
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const availableEvents = upcomingEvents.filter((e) => !participatedEventIds.has(e.id))

  // Map to camelCase for frontend
  const participation = rawHistory.map((r) => mapParticipationRow(r, volunteer.id))

  return {
    volunteer,
    participation,
    availableEvents,
    stats,
  }
}

/**
 * Get all active volunteers (for dropdowns/selects)
 */
export async function getActiveVolunteersList() {
  await getAuthUser()
  return queries.getVolunteersWithStats()
}

/**
 * Get unlinked volunteers (CSV-imported, no auth account)
 * Admin only — used for the merge UI
 */
export async function getUnlinkedVolunteers() {
  await requireAdmin()
  const rows = await db.execute(sql`
    SELECT id, first_name, last_name, email, roll_number, branch, year,
           is_active, created_at
    FROM volunteers
    WHERE auth_user_id IS NULL
    ORDER BY first_name, last_name
  `)
  return Array.isArray(rows) ? rows : []
}

/**
 * Merge an unlinked CSV volunteer into an authenticated volunteer.
 * Transfers all participation history, roles, and event ownership.
 * Admin only.
 */
export async function mergeVolunteers(keepId: string, removeId: string) {
  const admin = await requireAdmin()

  // Validate UUIDs
  const uuidSchema = z.string().uuid()
  uuidSchema.parse(keepId)
  uuidSchema.parse(removeId)

  if (keepId === removeId) {
    throw new Error('Cannot merge a volunteer into itself')
  }

  const result = await db.execute(
    sql`SELECT merge_volunteers(${keepId}::uuid, ${removeId}::uuid) as result`
  )

  logAudit({ action: 'volunteer.merge', actorId: admin.id, targetType: 'volunteer', targetId: keepId, details: { removedId: removeId } })
  revalidatePath('/volunteers')
  revalidatePath('/user-management')
  revalidatePath('/profile')

  const row = Array.isArray(result) ? result[0] : null
  return row?.result ?? { success: true }
}

/**
 * Deactivate a volunteer (soft-delete) and remove their Better Auth account.
 * Admin only. This:
 * 1. Sets is_active = false on the volunteer row
 * 2. Deletes sessions, accounts, and user from Better Auth tables
 * 3. Unlinks auth_user_id from the volunteer
 */
export async function deactivateVolunteer(volunteerId: string) {
  const admin = await requireAdmin()
  z.string().uuid().parse(volunteerId)

  const volunteer = await db.query.volunteers.findFirst({
    where: eq(volunteers.id, volunteerId),
  })
  if (!volunteer) throw new Error('Volunteer not found')

  // Soft-delete the volunteer
  await db
    .update(volunteers)
    .set({ isActive: false, status: 'inactive', authUserId: null, updatedAt: new Date() })
    .where(eq(volunteers.id, volunteerId))

  // Clean up Better Auth tables if linked
  if (volunteer.authUserId) {
    await db.execute(sql`DELETE FROM "session" WHERE "user_id" = ${volunteer.authUserId}`)
    await db.execute(sql`DELETE FROM "account" WHERE "user_id" = ${volunteer.authUserId}`)
    await db.execute(sql`DELETE FROM "user" WHERE "id" = ${volunteer.authUserId}`)
  }

  logAudit({ action: 'volunteer.deactivate', actorId: admin.id, targetType: 'volunteer', targetId: volunteerId })
  revalidatePath('/volunteers')
  revalidatePath('/user-management')
  return { success: true }
}

/**
 * Reactivate a deactivated volunteer. Admin only.
 */
export async function reactivateVolunteer(volunteerId: string) {
  const admin = await requireAdmin()
  z.string().uuid().parse(volunteerId)

  await db
    .update(volunteers)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(volunteers.id, volunteerId))

  logAudit({ action: 'volunteer.reactivate', actorId: admin.id, targetType: 'volunteer', targetId: volunteerId })
  revalidatePath('/volunteers')
  revalidatePath('/user-management')
  return { success: true }
}

/**
 * Create a volunteer manually (admin only).
 *
 * Leaves auth_user_id null — the row will auto-link to a Better Auth account
 * when the person signs up with the matching email, via the merge_volunteers()
 * SECURITY DEFINER function from migration 0003.
 */
export async function createVolunteer(input: z.infer<typeof adminCreateSchema>) {
  const admin = await requireAdmin()
  const parsed = adminCreateSchema.parse(input)

  const [created] = await db
    .insert(volunteers)
    .values({
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      rollNumber: parsed.rollNumber,
      email: parsed.email,
      branch: parsed.branch,
      year: parsed.year,
      phoneNo: parsed.phoneNo ?? null,
      nssJoinYear: parsed.nssJoinYear ?? null,
      status: 'active',
      isActive: true,
    })
    .returning()

  logAudit({
    action: 'volunteer.create',
    actorId: admin.id,
    targetType: 'volunteer',
    targetId: created.id,
    details: {
      email: parsed.email,
      rollNumber: parsed.rollNumber,
      branch: parsed.branch,
      year: parsed.year,
    },
  })
  revalidatePath('/user-management')
  revalidatePath('/volunteers')
  return { id: created.id }
}

/**
 * Pre-flight reference count for permanent deletion.
 * Admin-only. Used by the UI to populate the delete-confirmation modal.
 *
 * canPermanentlyDelete is false if the user still has active login ability
 * (is_active = true) OR if they created any events (FK RESTRICT blocks deletion).
 */
export async function getVolunteerReferences(volunteerId: string) {
  await requireAdmin()
  z.string().uuid().parse(volunteerId)

  const volunteer = await db.query.volunteers.findFirst({
    where: eq(volunteers.id, volunteerId),
  })
  if (!volunteer) throw new Error('Volunteer not found')

  const rows = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM event_participation WHERE volunteer_id = ${volunteerId})::int AS participations,
      (SELECT COUNT(*) FROM events WHERE created_by_volunteer_id = ${volunteerId})::int AS events_created,
      (SELECT COUNT(*) FROM user_roles WHERE volunteer_id = ${volunteerId})::int AS roles,
      (SELECT COUNT(*) FROM audit_logs WHERE actor_id = ${volunteerId})::int AS audit_entries
  `)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw SQL
  const row = (Array.isArray(rows) ? rows[0] : null) as any
  const participations = Number(row?.participations ?? 0)
  const eventsCreated = Number(row?.events_created ?? 0)
  const roles = Number(row?.roles ?? 0)
  const auditEntries = Number(row?.audit_entries ?? 0)

  return {
    volunteerId,
    fullName: `${volunteer.firstName} ${volunteer.lastName}`,
    isActive: volunteer.isActive === true,
    participations,
    eventsCreated,
    roles,
    auditEntries,
    hasAnyReferences: participations + eventsCreated + roles + auditEntries > 0,
    // Block permanent delete if still active OR if they created events
    canPermanentlyDelete: volunteer.isActive !== true && eventsCreated === 0,
    blockReason:
      volunteer.isActive === true
        ? 'User must be deactivated first'
        : eventsCreated > 0
          ? `User created ${eventsCreated} event(s). Cannot delete without orphaning events.`
          : null,
  }
}

/**
 * Permanently delete a volunteer. Destructive, irreversible.
 * Guardrails:
 *   1. Admin-only
 *   2. User must already be deactivated (is_active = false)
 *   3. Typed-name must match firstName + ' ' + lastName (case-insensitive, trimmed)
 *   4. Blocks if user created any events (FK RESTRICT would fail anyway)
 *   5. Nulls audit_logs.actor_id first (FK is RESTRICT by default, would block otherwise)
 *
 * event_participation and user_roles cascade automatically via ON DELETE CASCADE.
 * Better Auth rows were already deleted at deactivation time.
 */
export async function permanentlyDeleteVolunteer(volunteerId: string, typedName: string) {
  const admin = await requireAdmin()
  z.string().uuid().parse(volunteerId)

  const volunteer = await db.query.volunteers.findFirst({
    where: eq(volunteers.id, volunteerId),
  })
  if (!volunteer) throw new Error('Volunteer not found')

  if (volunteer.isActive === true) {
    throw new Error('Deactivate the user first, then permanently delete.')
  }

  const expectedName = `${volunteer.firstName} ${volunteer.lastName}`.trim().toLowerCase()
  const provided = typedName.trim().toLowerCase()
  if (provided !== expectedName) {
    throw new Error('Typed name does not match the user. Deletion aborted.')
  }

  // Block if they created events (FK RESTRICT would throw; pre-check gives clearer error)
  const eventsCreated = await db.execute(sql`
    SELECT COUNT(*)::int AS n FROM events WHERE created_by_volunteer_id = ${volunteerId}
  `)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw SQL
  const evtRow = (Array.isArray(eventsCreated) ? eventsCreated[0] : null) as any
  if (Number(evtRow?.n ?? 0) > 0) {
    throw new Error('Cannot permanently delete: user created events. Keep deactivated to preserve event history.')
  }

  await db.transaction(async (tx) => {
    // Anonymize audit entries this user performed (preserve the log, drop the FK)
    await tx.execute(sql`UPDATE audit_logs SET actor_id = NULL WHERE actor_id = ${volunteerId}`)
    // event_participation and user_roles cascade via FK
    await tx.delete(volunteers).where(eq(volunteers.id, volunteerId))
  })

  logAudit({
    action: 'volunteer.permanent_delete',
    actorId: admin.id,
    targetType: 'volunteer',
    targetId: volunteerId,
    details: {
      fullName: `${volunteer.firstName} ${volunteer.lastName}`,
      rollNumber: volunteer.rollNumber,
      email: volunteer.email,
    },
  })
  revalidatePath('/user-management')
  revalidatePath('/volunteers')
  return { success: true }
}

/**
 * Update profile picture URL
 */
export async function updateProfilePicture(profilePicUrl: string) {
  const volunteer = await getCachedVolunteer()

  // Validate URL: must be a valid HTTPS URL, max 2048 chars
  const urlSchema = z.string().url().max(2048).refine(
    (url) => url.startsWith('https://'),
    { message: 'Profile picture URL must use HTTPS' }
  )
  urlSchema.parse(profilePicUrl)

  const result = await queries.adminUpdateVolunteer(volunteer.id, {
    profilePic: profilePicUrl,
  })

  logAudit({ action: 'volunteer.profile_pic', actorId: volunteer.id, targetType: 'volunteer', targetId: volunteer.id })
  revalidatePath('/profile')
  return result
}
