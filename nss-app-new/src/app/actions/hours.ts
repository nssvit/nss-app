'use server'

import { revalidatePath } from 'next/cache'
import { queries } from '@/db/queries'
import { createClient } from '@/lib/supabase/server'

/**
 * Auth helper - ensures user is authenticated
 */
async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized: Please sign in')
  }

  return user
}

/**
 * Get current user's volunteer ID
 */
async function getCurrentVolunteerId() {
  const user = await requireAuth()
  const volunteer = await queries.getVolunteerByAuthId(user.id)
  if (!volunteer) {
    throw new Error('Volunteer profile not found')
  }
  return volunteer.id
}

/**
 * Get all pending hour approvals
 */
export async function getPendingApprovals() {
  await requireAuth()
  const rows = await queries.getPendingParticipations()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- map Drizzle types to frontend types
  return rows.map((r: any) => ({
    id: r.id,
    eventId: r.eventId,
    volunteerId: r.volunteerId,
    participationStatus: r.participationStatus,
    hoursAttended: r.hoursAttended ?? 0,
    approvalStatus: r.approvalStatus,
    approvedBy: r.approvedBy,
    approvedAt: r.approvedAt,
    feedback: r.feedback,
    registeredAt: r.registrationDate ?? r.createdAt,
    updatedAt: r.updatedAt,
    volunteer: r.volunteer,
    volunteerName: r.volunteer ? `${r.volunteer.firstName} ${r.volunteer.lastName}` : undefined,
    event: r.event,
    eventName: r.event?.eventName,
    categoryName: r.event?.category?.categoryName,
  }))
}

/**
 * Approve hours for a participation
 */
export async function approveHours(
  participationId: string,
  approvedHours?: number,
  notes?: string
) {
  const approvedBy = await getCurrentVolunteerId()
  const result = await queries.approveHoursTransaction(
    participationId,
    approvedBy,
    approvedHours,
    notes
  )
  revalidatePath('/hours-approval')
  revalidatePath('/reports')
  return result
}

/**
 * Reject hours for a participation
 */
export async function rejectHours(participationId: string, notes?: string) {
  const rejectedBy = await getCurrentVolunteerId()
  const result = await queries.rejectHoursTransaction(participationId, rejectedBy, notes)
  revalidatePath('/hours-approval')
  return result
}

/**
 * Bulk approve multiple participations
 */
export async function bulkApproveHours(participationIds: string[], notes?: string) {
  const approvedBy = await getCurrentVolunteerId()
  const result = await queries.bulkApproveHoursTransaction(participationIds, approvedBy, notes)
  revalidatePath('/hours-approval')
  revalidatePath('/reports')
  return result
}

/**
 * Reset approval status back to pending
 */
export async function resetApproval(participationId: string) {
  await requireAuth()
  const result = await queries.resetApprovalTransaction(participationId)
  revalidatePath('/hours-approval')
  return result
}

/**
 * Get pending approvals count
 */
export async function getPendingCount() {
  await requireAuth()
  return queries.getPendingApprovalsCount()
}
