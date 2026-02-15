import { useState, useMemo } from 'react'

export type SortDirection = 'asc' | 'desc'

export function useTableSort<T>(items: T[]) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const sortedItems = useMemo(() => {
    if (!sortKey) return items
    return [...items].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]

      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      let cmp: number
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal
      } else if (aVal instanceof Date && bVal instanceof Date) {
        cmp = aVal.getTime() - bVal.getTime()
      } else {
        cmp = String(aVal).localeCompare(String(bVal))
      }
      return sortDirection === 'desc' ? -cmp : cmp
    })
  }, [items, sortKey, sortDirection])

  function toggleSort(key: keyof T) {
    if (sortKey === key) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  return { sortedItems, sortKey, sortDirection, toggleSort }
}
