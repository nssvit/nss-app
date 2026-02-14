'use client'

import { useState, useEffect, useCallback } from 'react'
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
      console.error('Failed to load pending approvals:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const approveHours = async (id: string) => {
    try {
      await approveHoursAction(id)
      setPendingApprovals((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      console.error('Failed to approve hours:', err)
    }
  }

  const rejectHours = async (id: string) => {
    try {
      await rejectHoursAction(id)
      setPendingApprovals((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      console.error('Failed to reject hours:', err)
    }
  }

  return { pendingApprovals, loading, approveHours, rejectHours, refresh }
}
