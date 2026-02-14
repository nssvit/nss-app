'use client'

import { useState, useEffect, useCallback } from 'react'
import type { EventParticipationWithEvent } from '@/types'
import { useAuth } from '@/contexts/auth-context'
import { getVolunteerParticipationHistory } from '@/app/actions/volunteers'

export function useProfile(initialParticipations?: EventParticipationWithEvent[]) {
  const { currentUser } = useAuth()
  const [participations, setParticipations] = useState<EventParticipationWithEvent[]>(
    initialParticipations ?? []
  )
  const [loading, setLoading] = useState(!initialParticipations)

  const refresh = useCallback(async () => {
    if (!currentUser) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const p = await getVolunteerParticipationHistory(currentUser.volunteerId)
      setParticipations(p)
    } catch (err) {
      console.error('Failed to load profile data:', err)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    if (initialParticipations) return
    refresh()
  }, [initialParticipations, refresh])

  return { user: currentUser, participations, loading, refresh }
}
