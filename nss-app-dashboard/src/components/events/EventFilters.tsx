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
  searchTerm, categoryFilter, sessionFilter, categories,
  onSearchChange, onCategoryChange, onSessionChange, onClear,
}: EventFiltersProps) {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="relative flex-1 min-w-0">
        <input type="text" placeholder="Search events..." className="input-dark text-sm rounded-lg py-2 px-3 pl-9 w-full"
          value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} />
        <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm"></i>
      </div>
      <select className="input-dark text-sm rounded-lg py-2 px-3" value={categoryFilter} onChange={(e) => onCategoryChange(e.target.value)}>
        <option value="">All Categories</option>
        {categories.filter((c) => c.isActive).map((cat) => (
          <option key={cat.id} value={cat.categoryName}>{cat.categoryName}</option>
        ))}
      </select>
      <select className="input-dark text-sm rounded-lg py-2 px-3" value={sessionFilter} onChange={(e) => onSessionChange(e.target.value)}>
        <option value="">All Years</option>
        {years.map((year) => <option key={year} value={year}>{year}</option>)}
      </select>
      <button onClick={onClear} className="text-gray-500 hover:text-gray-300 text-sm py-2 px-3">Clear</button>
    </div>
  )
}
