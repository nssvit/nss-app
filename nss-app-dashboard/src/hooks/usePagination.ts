/**
 * usePagination - Hook for managing pagination logic
 */

'use client'

import { useState, useMemo, useCallback } from 'react'

interface UsePaginationOptions {
  itemsPerPage?: number
  initialPage?: number
}

export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions = {}
) {
  const { itemsPerPage = 12, initialPage = 1 } = options
  const [currentPage, setCurrentPage] = useState(initialPage)

  const totalPages = useMemo(
    () => Math.ceil(items.length / itemsPerPage),
    [items.length, itemsPerPage]
  )

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return items.slice(startIndex, startIndex + itemsPerPage)
  }, [items, currentPage, itemsPerPage])

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }, [totalPages])

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [currentPage, goToPage])

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [currentPage, goToPage])

  const resetPage = useCallback(() => {
    setCurrentPage(1)
  }, [])

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  }
}
