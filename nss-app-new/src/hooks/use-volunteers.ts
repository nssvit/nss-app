'use client'

import { useState, useEffect } from 'react'
import type { VolunteerWithStats } from '@/types'
import { getVolunteers } from '@/lib/mock-api'

export function useVolunteers() {
  const [volunteers, setVolunteers] = useState<VolunteerWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getVolunteers()
      setVolunteers(data)
      setLoading(false)
    }
    load()
  }, [])

  return { volunteers, loading }
}
