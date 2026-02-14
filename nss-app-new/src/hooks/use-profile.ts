'use client'

import { useState, useEffect } from 'react'
import type { CurrentUser, EventParticipationWithEvent } from '@/types'
import { getCurrentUser, getVolunteerParticipations } from '@/lib/mock-api'

export function useProfile() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [participations, setParticipations] = useState<EventParticipationWithEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const u = await getCurrentUser()
      const p = await getVolunteerParticipations(u.volunteerId)
      setUser(u)
      setParticipations(p)
      setLoading(false)
    }
    load()
  }, [])

  return { user, participations, loading }
}
