'use client'

import { useState, useEffect } from 'react'
import type { EventWithStats, EventCategory } from '@/types'
import { getEvents, getCategories } from '@/lib/mock-api'

export function useEvents() {
  const [events, setEvents] = useState<EventWithStats[]>([])
  const [categories, setCategories] = useState<EventCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [e, c] = await Promise.all([getEvents(), getCategories()])
      setEvents(e)
      setCategories(c)
      setLoading(false)
    }
    load()
  }, [])

  return { events, categories, loading }
}
