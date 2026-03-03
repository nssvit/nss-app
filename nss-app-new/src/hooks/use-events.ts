'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/error-utils'
import type { EventWithStats, EventCategory } from '@/types'
import { getEvents } from '@/app/actions/events'
import { getCategories } from '@/app/actions/categories'

interface EventsInitialData {
  events: EventWithStats[]
  categories: EventCategory[]
}

export function useEvents(initialData?: EventsInitialData) {
  const [events, setEvents] = useState<EventWithStats[]>(initialData?.events ?? [])
  const [categories, setCategories] = useState<EventCategory[]>(initialData?.categories ?? [])
  const [loading, setLoading] = useState(!initialData)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const [e, c] = await Promise.all([getEvents(), getCategories()])
      setEvents(e)
      setCategories(c)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      toast.error(getErrorMessage(err, 'Failed to load events'))
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
        const [e, c] = await Promise.all([getEvents(), getCategories()])
        if (!ignore) {
          setEvents(e)
          setCategories(c)
        }
      } catch (err) {
        if (ignore || (err instanceof Error && err.name === 'AbortError')) return
        toast.error(getErrorMessage(err, 'Failed to load events'))
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => { ignore = true }
  }, [initialData])

  return { events, categories, loading, refresh }
}
