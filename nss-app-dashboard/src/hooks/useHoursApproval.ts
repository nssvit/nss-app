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
  approveHours: (id: string, approvedHours?: number, notes?: string) => Promise<{ error: string | null }>
  rejectHours: (id: string, notes?: string) => Promise<{ error: string | null }>
  bulkApproveHours: (ids: string[], notes?: string) => Promise<{ count: number; error: string | null }>
  resetApproval: (id: string) => Promise<{ error: string | null }>
  getStats: () => { pending: number; approved: number; rejected: number; total: number; totalHoursPending: number; totalHoursApproved: number }
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

      // Filter based on current filter
      let filtered = data as ParticipationForApproval[]
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
        return { count: result?.length || ids.length, error: null }
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

    return { pending, approved, rejected, total: pending + approved + rejected, totalHoursPending, totalHoursApproved }
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
