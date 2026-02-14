'use client'

import { useState, useEffect, useCallback } from 'react'
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
      console.error('Failed to load events:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialData) return
    refresh()
  }, [initialData, refresh])

  return { events, categories, loading, refresh }
}
