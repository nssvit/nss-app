'use client'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number)=> void
  maxVisible?: number
  size?: 'sm' | 'md'
  isMobile?: boolean
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisible = 5,
  size = 'md',
  isMobile = false
}: PaginationProps) {
  if (totalPages <= 1) return null

  const sizeClass = size === 'sm' ? 'btn-sm' : 'btn-md'

  const getPageNumbers = () => {
    const pages: number[] = []
    const start = Math.max(1, Math.min(totalPages - maxVisible + 1, currentPage - Math.floor(maxVisible / 2)))
    const end = Math.min(totalPages, start + maxVisible - 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    return pages
  }

  return (
    <nav className={`flex ${isMobile ? 'gap-1' : 'gap-2'}`}>
      {/* Previous Button */}
      <button
        className={`btn ${sizeClass} btn-secondary`}
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
      >
        {isMobile ? '‹' : 'Previous'}
      </button>

      {/* Page Numbers */}
      {!isMobile && getPageNumbers().map((page) => (
        <button
          key={page}
          className={`btn ${sizeClass} ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => onPageChange(page)}
          aria-label={`Page ${page}`}
          aria-current={currentPage === page ? 'page' : undefined}
        >
          {page}
        </button>
      ))}

      {/* Mobile: Current page indicator */}
      {isMobile && (
        <span className="flex items-center px-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
          {currentPage} / {totalPages}
        </span>
      )}

      {/* Next Button */}
      <button
        className={`btn ${sizeClass} btn-secondary`}
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
      >
        {isMobile ? '›' : 'Next'}
      </button>
    </nav>
  )
}
