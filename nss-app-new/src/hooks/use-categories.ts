'use client'

import { useState, useEffect } from 'react'
import type { EventCategory } from '@/types'
import { getCategories } from '@/lib/mock-api'

export function useCategories() {
  const [categories, setCategories] = useState<EventCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getCategories()
      setCategories(data)
      setLoading(false)
    }
    load()
  }, [])

  return { categories, loading }
}
