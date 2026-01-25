'use client'

/**
 * EventFilters Component
 * Search and filter controls for events
 */

import type { EventCategory } from './types'

interface EventFiltersProps {
  searchTerm: string
  categoryFilter: string
  sessionFilter: string
  categories: EventCategory[]
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onSessionChange: (value: string) => void
  onClear: () => void
}

export function EventFilters({
  searchTerm,
  categoryFilter,
  sessionFilter,
  categories,
  onSearchChange,
  onCategoryChange,
  onSessionChange,
  onClear,
}: EventFiltersProps) {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <div className="relative min-w-0 flex-1">
        <input
          type="text"
          placeholder="Search events..."
          className="input-dark w-full rounded-lg px-3 py-2 pl-9 text-sm"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <i className="fas fa-search absolute top-1/2 left-3 -translate-y-1/2 transform text-sm text-gray-500"></i>
      </div>
      <select
        className="input-dark rounded-lg px-3 py-2 text-sm"
        value={categoryFilter}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        <option value="">All Categories</option>
        {categories
          .filter((c) => c.isActive)
          .map((cat) => (
            <option key={cat.id} value={cat.categoryName}>
              {cat.categoryName}
            </option>
          ))}
      </select>
      <select
        className="input-dark rounded-lg px-3 py-2 text-sm"
        value={sessionFilter}
        onChange={(e) => onSessionChange(e.target.value)}
      >
        <option value="">All Years</option>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      <button onClick={onClear} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-300">
        Clear
      </button>
    </div>
  )
}
