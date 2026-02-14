'use client'

import { useState, useEffect, useCallback } from 'react'
import type { VolunteerWithStats } from '@/types'
import { getVolunteers } from '@/app/actions/volunteers'

export function useVolunteers(initialData?: VolunteerWithStats[]) {
  const [volunteers, setVolunteers] = useState<VolunteerWithStats[]>(initialData ?? [])
  const [loading, setLoading] = useState(!initialData)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getVolunteers()
      setVolunteers(data)
    } catch (err) {
      console.error('Failed to load volunteers:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialData) return
    refresh()
  }, [initialData, refresh])

  return { volunteers, loading, refresh }
}
