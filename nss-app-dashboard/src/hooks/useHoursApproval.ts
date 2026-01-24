'use client'

/**
 * Hours Approval Hook
 *
 * Manages hours approval workflow using Server Actions (Drizzle ORM)
 * Simplified from 338 LOC to ~120 LOC
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getPendingApprovals,
  approveHours as approveHoursAction,
  rejectHours as rejectHoursAction,
  bulkApproveHours as bulkApproveAction,
  resetApproval as resetApprovalAction,
  getPendingCount,
} from '@/app/actions/hours'

export interface VolunteerForApproval {
  id: string
  firstName: string
  lastName: string
  email: string | null
  rollNumber: string | null
  profilePic: string | null
  // Snake case aliases
  first_name?: string
  last_name?: string
  roll_number?: string
  profile_pic?: string
}

export interface EventForApproval {
  id: string
  eventName: string
  startDate: string | null
  endDate: string | null
  description: string | null
  // Snake case aliases
  event_name?: string
  start_date?: string | null
}

export interface ApproverForApproval {
  id: string
  firstName: string
  lastName: string
  first_name?: string
  last_name?: string
}

export interface ParticipationForApproval {
  id: string
  eventId: string
  volunteerId: string
  hoursAttended: number
  declaredHours: number | null
  approvedHours: number | null
  participationStatus: string
  approvalStatus: string
  approvedBy: string | null
  approvedAt: Date | null
  approvalNotes: string | null
  registrationDate: Date | null
  attendanceDate: Date | null
  notes: string | null
  createdAt: Date | null
  // Nested objects
  volunteer?: VolunteerForApproval
  event?: EventForApproval
  approvedByVolunteer?: ApproverForApproval
  // Snake case aliases
  hours_attended?: number
  declared_hours?: number | null
  approved_hours?: number | null
  participation_status?: string
  approval_status?: string
  approved_by?: string | null
  approved_at?: Date | null
  approval_notes?: string | null
  registration_date?: Date | null
  attendance_date?: Date | null
  approved_by_volunteer?: ApproverForApproval
}

export type ApprovalFilter = 'pending' | 'approved' | 'rejected' | 'all'

export interface UseHoursApprovalReturn {
  participations: ParticipationForApproval[]
  loading: boolean
  error: string | null
  filter: ApprovalFilter
  pendingCount: number
  setFilter: (filter: ApprovalFilter) => void
  refetch: () => Promise<void>
  approveHours: (
    id: string,
    approvedHours?: number,
    notes?: string
  ) => Promise<{ error: string | null }>
  rejectHours: (id: string, notes?: string) => Promise<{ error: string | null }>
  bulkApproveHours: (
    ids: string[],
    notes?: string
  ) => Promise<{ count: number; error: string | null }>
  resetApproval: (id: string) => Promise<{ error: string | null }>
  getStats: () => {
    pending: number
    approved: number
    rejected: number
    total: number
    totalHoursPending: number
    totalHoursApproved: number
  }
}

export function useHoursApproval(): UseHoursApprovalReturn {
  const [participations, setParticipations] = useState<ParticipationForApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ApprovalFilter>('pending')
  const [pendingCount, setPendingCount] = useState(0)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [data, count] = await Promise.all([
        getPendingApprovals(),
        getPendingCount().catch(() => 0),
      ])

      // Transform data to include both camelCase and snake_case aliases
      const transformed = (data as any[]).map((p) => ({
        ...p,
        // Snake case aliases for main properties
        hours_attended: p.hoursAttended,
        declared_hours: p.declaredHours,
        approved_hours: p.approvedHours,
        participation_status: p.participationStatus,
        approval_status: p.approvalStatus,
        approved_by: p.approvedBy,
        approved_at: p.approvedAt,
        approval_notes: p.approvalNotes,
        registration_date: p.registrationDate,
        attendance_date: p.attendanceDate,
        // Transform nested volunteer
        volunteer: p.volunteer
          ? {
              ...p.volunteer,
              first_name: p.volunteer.firstName,
              last_name: p.volunteer.lastName,
              roll_number: p.volunteer.rollNumber,
              profile_pic: p.volunteer.profilePic,
            }
          : undefined,
        // Transform nested event
        event: p.event
          ? {
              ...p.event,
              event_name: p.event.eventName,
              start_date: p.event.startDate,
            }
          : undefined,
        // Transform nested approver
        approved_by_volunteer: p.approvedByVolunteer
          ? {
              ...p.approvedByVolunteer,
              first_name: p.approvedByVolunteer.firstName,
              last_name: p.approvedByVolunteer.lastName,
            }
          : undefined,
        approvedByVolunteer: p.approvedByVolunteer,
      })) as ParticipationForApproval[]

      // Filter based on current filter
      let filtered = transformed
      if (filter !== 'all') {
        filtered = filtered.filter((p) => p.approvalStatus === filter)
      }

      setParticipations(filtered)
      setPendingCount(count)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch participations'
      console.error('[useHoursApproval] Error:', message)
      setError(message)
      setParticipations([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  const handleApprove = useCallback(
    async (id: string, approvedHours?: number, notes?: string) => {
      try {
        await approveHoursAction(id, approvedHours, notes)
        await fetchData()
        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to approve hours' }
      }
    },
    [fetchData]
  )

  const handleReject = useCallback(
    async (id: string, notes?: string) => {
      try {
        await rejectHoursAction(id, notes)
        await fetchData()
        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to reject hours' }
      }
    },
    [fetchData]
  )

  const handleBulkApprove = useCallback(
    async (ids: string[], notes?: string) => {
      try {
        if (ids.length === 0) return { count: 0, error: null }
        const result = await bulkApproveAction(ids, notes)
        await fetchData()
        return { count: result?.count || ids.length, error: null }
      } catch (err) {
        return { count: 0, error: err instanceof Error ? err.message : 'Failed to bulk approve' }
      }
    },
    [fetchData]
  )

  const handleReset = useCallback(
    async (id: string) => {
      try {
        await resetApprovalAction(id)
        await fetchData()
        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to reset approval' }
      }
    },
    [fetchData]
  )

  const getStats = useCallback(() => {
    const pending = participations.filter((p) => p.approvalStatus === 'pending').length
    const approved = participations.filter((p) => p.approvalStatus === 'approved').length
    const rejected = participations.filter((p) => p.approvalStatus === 'rejected').length
    const totalHoursPending = participations
      .filter((p) => p.approvalStatus === 'pending')
      .reduce((sum, p) => sum + (p.hoursAttended || 0), 0)
    const totalHoursApproved = participations
      .filter((p) => p.approvalStatus === 'approved')
      .reduce((sum, p) => sum + (p.approvedHours || 0), 0)

    return {
      pending,
      approved,
      rejected,
      total: pending + approved + rejected,
      totalHoursPending,
      totalHoursApproved,
    }
  }, [participations])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    participations,
    loading,
    error,
    filter,
    pendingCount,
    setFilter,
    refetch: fetchData,
    approveHours: handleApprove,
    rejectHours: handleReject,
    bulkApproveHours: handleBulkApprove,
    resetApproval: handleReset,
    getStats,
  }
}
