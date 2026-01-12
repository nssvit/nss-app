'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface ParticipationForApproval {
  id: string
  event_id: string
  volunteer_id: string
  hours_attended: number
  declared_hours: number | null
  approved_hours: number | null
  participation_status: string
  approval_status: string
  approved_by: string | null
  approved_at: string | null
  approval_notes: string | null
  registration_date: string
  attendance_date: string | null
  notes: string | null
  created_at: string
  volunteers: {
    id: string
    first_name: string
    last_name: string
    email: string
    roll_number: string
    profile_pic: string | null
  } | null
  events: {
    id: string
    title: string
    event_date: string
    location: string | null
  } | null
}

export type ApprovalFilter = 'pending' | 'approved' | 'rejected' | 'all'

export function useHoursApproval() {
  const [participations, setParticipations] = useState<ParticipationForApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ApprovalFilter>('pending')
  const [pendingCount, setPendingCount] = useState(0)

  // Fetch participations based on filter
  const fetchParticipations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Simple query first - no joins
      let query = supabase
        .from('event_participation')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply filter
      if (filter !== 'all') {
        query = query.eq('approval_status', filter)
      }

      // Only show records with hours to approve (attended events)
      if (filter === 'pending') {
        query = query.in('participation_status', ['attended', 'present', 'partial', 'partially_present'])
        query = query.gt('hours_attended', 0)
      }

      const { data, error: queryError } = await query

      if (queryError) throw queryError

      setParticipations(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch participations'
      console.error('Error fetching participations:', errorMessage)
      setError(errorMessage)
      setParticipations([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  // Fetch pending count
  const fetchPendingCount = useCallback(async () => {
    try {
      // Try to use the database function first
      const { data, error } = await supabase.rpc('get_pending_approvals_count')

      if (error) {
        // Fallback to manual count if function doesn't exist
        const { count, error: countError } = await supabase
          .from('event_participation')
          .select('*', { count: 'exact', head: true })
          .eq('approval_status', 'pending')
          .in('participation_status', ['attended', 'present', 'partial', 'partially_present'])
          .gt('hours_attended', 0)

        if (countError) throw countError
        setPendingCount(count || 0)
      } else {
        setPendingCount(data || 0)
      }
    } catch (err) {
      console.error('Error fetching pending count:', err)
      // Don't set error for count failures, just use 0
      setPendingCount(0)
    }
  }, [])

  // Approve hours for a single participation
  const approveHours = async (
    participationId: string,
    approvedBy: string,
    approvedHours?: number,
    notes?: string
  ) => {
    try {
      // Try to use database function first
      const { data: rpcResult, error: rpcError } = await supabase.rpc('approve_hours', {
        p_participation_id: participationId,
        p_approved_by: approvedBy,
        p_approved_hours: approvedHours ?? null,
        p_notes: notes ?? null,
      })

      if (rpcError) {
        // Fallback to direct update if function doesn't exist
        const participation = participations.find(p => p.id === participationId)
        const { error: updateError } = await supabase
          .from('event_participation')
          .update({
            approval_status: 'approved',
            approved_by: approvedBy,
            approved_at: new Date().toISOString(),
            approved_hours: approvedHours ?? participation?.hours_attended ?? 0,
            approval_notes: notes ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', participationId)

        if (updateError) throw updateError
      }

      // Refresh data
      await Promise.all([fetchParticipations(), fetchPendingCount()])
      return { error: null }
    } catch (err) {
      console.error('Error approving hours:', err)
      return {
        error: err instanceof Error ? err.message : 'Failed to approve hours',
      }
    }
  }

  // Reject hours for a single participation
  const rejectHours = async (participationId: string, rejectedBy: string, notes?: string) => {
    try {
      // Try to use database function first
      const { error: rpcError } = await supabase.rpc('reject_hours', {
        p_participation_id: participationId,
        p_rejected_by: rejectedBy,
        p_notes: notes ?? null,
      })

      if (rpcError) {
        // Fallback to direct update
        const { error: updateError } = await supabase
          .from('event_participation')
          .update({
            approval_status: 'rejected',
            approved_by: rejectedBy,
            approved_at: new Date().toISOString(),
            approved_hours: 0,
            approval_notes: notes ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', participationId)

        if (updateError) throw updateError
      }

      // Refresh data
      await Promise.all([fetchParticipations(), fetchPendingCount()])
      return { error: null }
    } catch (err) {
      console.error('Error rejecting hours:', err)
      return {
        error: err instanceof Error ? err.message : 'Failed to reject hours',
      }
    }
  }

  // Bulk approve hours
  const bulkApproveHours = async (
    participationIds: string[],
    approvedBy: string,
    notes?: string
  ) => {
    try {
      if (participationIds.length === 0) {
        return { count: 0, error: null }
      }

      // Try to use database function first
      const { data: rpcResult, error: rpcError } = await supabase.rpc('bulk_approve_hours', {
        p_participation_ids: participationIds,
        p_approved_by: approvedBy,
        p_notes: notes ?? 'Bulk approved',
      })

      if (rpcError) {
        // Fallback to batch update
        const { error: updateError } = await supabase
          .from('event_participation')
          .update({
            approval_status: 'approved',
            approved_by: approvedBy,
            approved_at: new Date().toISOString(),
            approval_notes: notes ?? 'Bulk approved',
            updated_at: new Date().toISOString(),
          })
          .in('id', participationIds)
          .eq('approval_status', 'pending')

        if (updateError) throw updateError
      }

      // Refresh data
      await Promise.all([fetchParticipations(), fetchPendingCount()])
      return { count: participationIds.length, error: null }
    } catch (err) {
      console.error('Error bulk approving hours:', err)
      return {
        count: 0,
        error: err instanceof Error ? err.message : 'Failed to bulk approve hours',
      }
    }
  }

  // Reset approval (move back to pending)
  const resetApproval = async (participationId: string) => {
    try {
      const { error } = await supabase
        .from('event_participation')
        .update({
          approval_status: 'pending',
          approved_by: null,
          approved_at: null,
          approved_hours: null,
          approval_notes: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', participationId)

      if (error) throw error

      // Refresh data
      await Promise.all([fetchParticipations(), fetchPendingCount()])
      return { error: null }
    } catch (err) {
      console.error('Error resetting approval:', err)
      return {
        error: err instanceof Error ? err.message : 'Failed to reset approval',
      }
    }
  }

  // Get participations by volunteer
  const getParticipationsByVolunteer = useCallback(
    (volunteerId: string) => {
      return participations.filter(p => p.volunteer_id === volunteerId)
    },
    [participations]
  )

  // Get participations by event
  const getParticipationsByEvent = useCallback(
    (eventId: string) => {
      return participations.filter(p => p.event_id === eventId)
    },
    [participations]
  )

  // Stats for the current filter
  const getStats = useCallback(() => {
    const pending = participations.filter(p => p.approval_status === 'pending').length
    const approved = participations.filter(p => p.approval_status === 'approved').length
    const rejected = participations.filter(p => p.approval_status === 'rejected').length
    const totalHoursPending = participations
      .filter(p => p.approval_status === 'pending')
      .reduce((sum, p) => sum + (p.hours_attended || 0), 0)
    const totalHoursApproved = participations
      .filter(p => p.approval_status === 'approved')
      .reduce((sum, p) => sum + (p.approved_hours || 0), 0)

    return {
      pending,
      approved,
      rejected,
      total: pending + approved + rejected,
      totalHoursPending,
      totalHoursApproved,
    }
  }, [participations])

  // Initial fetch
  useEffect(() => {
    fetchParticipations()
    fetchPendingCount()
  }, [fetchParticipations, fetchPendingCount])

  return {
    // State
    participations,
    loading,
    error,
    filter,
    pendingCount,

    // Actions
    setFilter,
    fetchParticipations,
    fetchPendingCount,

    // Approval mutations
    approveHours,
    rejectHours,
    bulkApproveHours,
    resetApproval,

    // Query helpers
    getParticipationsByVolunteer,
    getParticipationsByEvent,
    getStats,
  }
}
