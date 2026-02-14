'use client'

import { useState, useEffect } from 'react'
import type { EventParticipationWithVolunteer } from '@/types'
import { getPendingApprovals } from '@/lib/mock-api'

export function useHours() {
  const [pendingApprovals, setPendingApprovals] = useState<EventParticipationWithVolunteer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getPendingApprovals()
      setPendingApprovals(data)
      setLoading(false)
    }
    load()
  }, [])

  const approveHours = async (id: string) => {
    setPendingApprovals((prev) => prev.filter((p) => p.id !== id))
  }

  const rejectHours = async (id: string) => {
    setPendingApprovals((prev) => prev.filter((p) => p.id !== id))
  }

  return { pendingApprovals, loading, approveHours, rejectHours }
}
