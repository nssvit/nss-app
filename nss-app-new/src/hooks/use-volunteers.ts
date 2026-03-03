'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/error-utils'
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
      if (err instanceof Error && err.name === 'AbortError') return
      toast.error(getErrorMessage(err, 'Failed to load volunteers'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialData) return
    let ignore = false
    ;(async () => {
      try {
        setLoading(true)
        const data = await getVolunteers()
        if (!ignore) setVolunteers(data)
      } catch (err) {
        if (ignore || (err instanceof Error && err.name === 'AbortError')) return
        toast.error(getErrorMessage(err, 'Failed to load volunteers'))
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => { ignore = true }
  }, [initialData])

  return { volunteers, loading, refresh }
}
