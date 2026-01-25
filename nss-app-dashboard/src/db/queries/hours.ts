/**
 * Hours Approval Queries
 * Provides hours approval-related database operations
 */

import { db } from '../index'
import { eq, and, sql, count, desc, inArray } from 'drizzle-orm'
import { eventParticipation } from '../schema'

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
