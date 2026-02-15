'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { EventParticipationWithVolunteer } from '@/types'
import {
  getPendingApprovals,
  approveHours as approveHoursAction,
  rejectHours as rejectHoursAction,
} from '@/app/actions/hours'

export function useHours() {
  const [pendingApprovals, setPendingApprovals] = useState<EventParticipationWithVolunteer[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await getPendingApprovals()
      setPendingApprovals(data)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      console.error('Failed to load pending approvals:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const data = await getPendingApprovals()
        if (!ignore) setPendingApprovals(data)
      } catch (err) {
        if (ignore || (err instanceof Error && err.name === 'AbortError')) return
        console.error('Failed to load pending approvals:', err)
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => { ignore = true }
  }, [])

  const approveHours = async (id: string) => {
    try {
      await approveHoursAction(id)
      setPendingApprovals((prev) => prev.filter((p) => p.id !== id))
      toast.success('Hours approved')
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      toast.error('Failed to approve hours')
      console.error('Failed to approve hours:', err)
    }
  }

  const rejectHours = async (id: string) => {
    try {
      await rejectHoursAction(id)
      setPendingApprovals((prev) => prev.filter((p) => p.id !== id))
      toast.success('Hours rejected')
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      toast.error('Failed to reject hours')
      console.error('Failed to reject hours:', err)
    }
  }

  return { pendingApprovals, loading, approveHours, rejectHours, refresh }
}
