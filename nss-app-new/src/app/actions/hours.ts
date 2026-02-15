'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { queries } from '@/db/queries'
import { getAuthUser, requireAnyRole } from '@/lib/auth-cache'

/**
 * Get all pending hour approvals
 */
export async function getPendingApprovals() {
  await getAuthUser()
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
    notes: r.notes,
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
  const volunteer = await requireAnyRole('admin', 'head')

  // Validate approvedHours range
  if (approvedHours !== undefined && approvedHours !== null) {
    if (approvedHours < 0 || approvedHours > 24) {
      throw new Error('Approved hours must be between 0 and 24')
    }
  }

  const result = await queries.approveHoursTransaction(
    participationId,
    volunteer.id,
    approvedHours,
    notes
  )
  revalidateTag('dashboard-stats')
  revalidatePath('/hours-approval')
  revalidatePath('/reports')
  return result
}

/**
 * Reject hours for a participation
 */
export async function rejectHours(participationId: string, notes?: string) {
  const volunteer = await requireAnyRole('admin', 'head')
  const result = await queries.rejectHoursTransaction(participationId, volunteer.id, notes)
  revalidatePath('/hours-approval')
  return result
}

/**
 * Bulk approve multiple participations
 */
export async function bulkApproveHours(participationIds: string[], notes?: string) {
  const volunteer = await requireAnyRole('admin', 'head')
  const result = await queries.bulkApproveHoursTransaction(participationIds, volunteer.id, notes)
  revalidateTag('dashboard-stats')
  revalidatePath('/hours-approval')
  revalidatePath('/reports')
  return result
}

/**
 * Reset approval status back to pending
 */
export async function resetApproval(participationId: string) {
  await requireAnyRole('admin', 'head')
  const result = await queries.resetApprovalTransaction(participationId)
  revalidatePath('/hours-approval')
  return result
}

