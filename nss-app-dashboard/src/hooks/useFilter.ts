/**
 * useFilter - Hook for managing filtered data
 */

'use client'

import { useState, useMemo, useCallback } from 'react'

type FilterFunction<T> = (item: T) => boolean

export function useFilter<T>(items: T[]) {
  const [filters, setFilters] = useState<FilterFunction<T>[]>([])

  const filteredItems = useMemo(() => {
    return items.filter((item) => filters.every((filter) => filter(item)))
  }, [items, filters])

  const addFilter = useCallback((filter: FilterFunction<T>) => {
    setFilters((prev) => [...prev, filter])
  }, [])

  const removeFilter = useCallback((index: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters([])
  }, [])

  const setFilter = useCallback((index: number, filter: FilterFunction<T>) => {
    setFilters((prev) => prev.map((f, i) => (i === index ? filter : f)))
  }, [])

  return {
    filteredItems,
    filters,
    addFilter,
    removeFilter,
    clearFilters,
    setFilter,
    hasFilters: filters.length > 0,
  }
}
