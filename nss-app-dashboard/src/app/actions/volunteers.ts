'use server'

import { queries } from '@/db/queries'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Volunteer } from '@/db/schema'

/**
 * Auth helper - ensures user is authenticated
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
 * Get all volunteers with participation stats
 */
export async function getVolunteers() {
  await requireAuth()
  return queries.getVolunteersWithStats()
}

/**
 * Get a single volunteer by ID with roles and participations
 */
export async function getVolunteerById(volunteerId: string) {
  await requireAuth()
  return queries.getVolunteerById(volunteerId)
}

/**
 * Get volunteer by their Supabase auth user ID
 */
export async function getVolunteerByAuthId(authUserId: string) {
  await requireAuth()
  return queries.getVolunteerByAuthId(authUserId)
}

/**
 * Get current logged-in volunteer
 */
export async function getCurrentVolunteer() {
  const user = await requireAuth()
  return queries.getVolunteerByAuthId(user.id)
}

/**
 * Update volunteer information (admin only)
 */
export async function updateVolunteer(
  volunteerId: string,
  updates: Partial<Omit<Volunteer, 'id' | 'createdAt' | 'updatedAt'>>
) {
  await requireAuth()
  const result = await queries.adminUpdateVolunteer(volunteerId, updates)
  revalidatePath('/volunteers')
  revalidatePath('/profile')
  return result
}

/**
 * Get volunteer participation history
 */
export async function getVolunteerParticipationHistory(volunteerId: string) {
  await requireAuth()
  return queries.getVolunteerParticipationHistory(volunteerId)
}

/**
 * Get volunteer hours summary
 */
export async function getVolunteerHoursSummary() {
  await requireAuth()
  return queries.getVolunteerHoursSummary()
}

/**
 * Get current volunteer's profile with participation data
 */
export async function getMyProfile() {
  const user = await requireAuth()
  const volunteer = await queries.getVolunteerByAuthId(user.id)

  if (!volunteer) {
    throw new Error('Volunteer profile not found')
  }

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
  const user = await requireAuth()
  const volunteer = await queries.getVolunteerByAuthId(user.id)

  if (!volunteer) {
    throw new Error('Volunteer profile not found')
  }

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
 */
export async function getVolunteerDashboardData() {
  const user = await requireAuth()
  const volunteer = await queries.getVolunteerByAuthId(user.id)

  if (!volunteer) {
    throw new Error('Volunteer profile not found')
  }

  const [participationHistoryRaw, upcomingEventsRaw] = await Promise.all([
    queries.getVolunteerParticipationHistory(volunteer.id),
    queries.getUpcomingEvents(10),
  ])

  // Ensure arrays are not undefined
  const participationHistory = participationHistoryRaw || []
  const upcomingEvents = upcomingEventsRaw || []

  // Calculate stats from participation
  const stats = {
    totalHours: participationHistory.reduce((sum: number, p: any) => sum + (p.hours_attended || 0), 0),
    approvedHours: 0, // Will be calculated from approved participations
    eventsParticipated: participationHistory.length,
    pendingReviews: participationHistory.filter((p: any) => p.participation_status === 'present' && p.hours_attended > 0).length,
  }

  // Filter out events already registered for
  const participatedEventIds = new Set(participationHistory.map((p: any) => p.event_id))
  const availableEvents = upcomingEvents.filter(e => !participatedEventIds.has(e.id))

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
  await requireAuth()
  return queries.getVolunteersWithStats()
}

/**
 * Update profile picture URL
 */
export async function updateProfilePicture(profilePicUrl: string) {
  const user = await requireAuth()
  const volunteer = await queries.getVolunteerByAuthId(user.id)

  if (!volunteer) {
    throw new Error('Volunteer profile not found')
  }

  const result = await queries.adminUpdateVolunteer(volunteer.id, {
    profilePic: profilePicUrl,
  })

  revalidatePath('/profile')
  return result
}
