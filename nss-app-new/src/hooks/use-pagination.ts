import { useState, useMemo } from 'react'

export function usePagination<T>(items: T[], pageSize = 20) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))

  // Reset to page 1 when items change and current page is out of range
  const safePage = currentPage > totalPages ? 1 : currentPage

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, safePage, pageSize])

  return {
    paginatedItems,
    currentPage: safePage,
    totalPages,
    totalItems: items.length,
    setCurrentPage,
  }
}
