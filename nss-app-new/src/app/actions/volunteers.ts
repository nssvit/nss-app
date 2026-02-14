'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { queries } from '@/db/queries'
import type { Volunteer } from '@/db/schema'
import { getAuthUser, getCurrentVolunteer as getCachedVolunteer, requireAdmin } from '@/lib/auth-cache'
import { mapVolunteerRow, mapParticipationRow, mapVolunteerHoursSummaryRow } from '@/lib/mappers'

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
 * Get volunteer by their Supabase auth user ID
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
  await requireAdmin()
  const validated = adminUpdateSchema.parse(updates)
  const result = await queries.adminUpdateVolunteer(volunteerId, validated)
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
  const rows = await queries.getVolunteerHoursSummary()
  return rows.map(mapVolunteerHoursSummaryRow)
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
 * Update profile picture URL
 */
export async function updateProfilePicture(profilePicUrl: string) {
  const volunteer = await getCachedVolunteer()

  const result = await queries.adminUpdateVolunteer(volunteer.id, {
    profilePic: profilePicUrl,
  })

  revalidatePath('/profile')
  return result
}
