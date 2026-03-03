'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/error-utils'
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
      if (err instanceof Error && err.name === 'AbortError') return
      toast.error(getErrorMessage(err, 'Failed to load categories'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const data = await getAllCategories()
        if (!ignore) setCategories(data)
      } catch (err) {
        if (ignore || (err instanceof Error && err.name === 'AbortError')) return
        toast.error(getErrorMessage(err, 'Failed to load categories'))
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => { ignore = true }
  }, [])

  return { categories, loading, refresh }
}
