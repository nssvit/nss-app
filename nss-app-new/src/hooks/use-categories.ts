'use client'

import { useState, useEffect, useCallback } from 'react'
import type { EventCategory } from '@/types'
import { getAllCategories } from '@/app/actions/categories'

export function useCategories() {
  const [categories, setCategories] = useState<EventCategory[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await getAllCategories()
      setCategories(data)
    } catch (err) {
      console.error('Failed to load categories:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { categories, loading, refresh }
}
