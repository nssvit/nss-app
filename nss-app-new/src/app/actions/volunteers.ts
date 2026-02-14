'use server'

import { revalidatePath } from 'next/cache'
import { queries } from '@/db/queries'
import type { Volunteer } from '@/db/schema'
import { getAuthUser, getCurrentVolunteer as getCachedVolunteer } from '@/lib/auth-cache'
import { mapVolunteerRow, mapParticipationRow, mapVolunteerHoursSummaryRow } from '@/lib/mappers'

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
  await getAuthUser()
  const result = await queries.adminUpdateVolunteer(volunteerId, updates)
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
  const participation = await queries.getVolunteerParticipationHistory(volunteer.id)

  return {
    volunteer,
    participation,
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
}) {
  const volunteer = await getCachedVolunteer()

  const result = await queries.adminUpdateVolunteer(volunteer.id, {
    firstName: updates.firstName,
    lastName: updates.lastName,
    phoneNo: updates.phoneNo,
    address: updates.address,
    gender: updates.gender,
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
  const participationHistory = participationHistoryRaw || []
  const upcomingEvents = upcomingEventsRaw || []

  // Calculate stats from participation
  /* eslint-disable @typescript-eslint/no-explicit-any -- untyped query results */
  const stats = {
    totalHours: participationHistory.reduce(
      (sum: number, p: any) => sum + (p.hours_attended || 0),
      0
    ),
    approvedHours: participationHistory
      .filter((p: any) => p.approval_status === 'approved')
      .reduce((sum: number, p: any) => sum + (p.approved_hours || p.hours_attended || 0), 0),
    eventsParticipated: participationHistory.length,
    pendingReviews: participationHistory.filter(
      (p: any) => p.participation_status === 'present' && p.hours_attended > 0
    ).length,
  }

  // Filter out events already registered for
  const participatedEventIds = new Set(participationHistory.map((p: any) => p.event_id))
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const availableEvents = upcomingEvents.filter((e) => !participatedEventIds.has(e.id))

  return {
    volunteer,
    participation: participationHistory,
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
