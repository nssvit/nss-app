'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EVENT_STATUS, EVENT_STATUS_DISPLAY } from '@/lib/constants'
import type { EventCategory } from '@/types'

interface EventFiltersProps {
  categories: EventCategory[]
  onFilterChange: (filters: {
    search: string
    categoryId: number | null
    status: string | null
  }) => void
}

export function EventFilters({ categories, onFilterChange }: EventFiltersProps) {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  function handleSearchChange(value: string) {
    setSearch(value)
    onFilterChange({ search: value, categoryId, status })
  }

  function handleCategoryChange(value: string) {
    const newCategoryId = value === 'all' ? null : Number(value)
    setCategoryId(newCategoryId)
    onFilterChange({ search, categoryId: newCategoryId, status })
  }

  function handleStatusChange(value: string) {
    const newStatus = value === 'all' ? null : value
    setStatus(newStatus)
    onFilterChange({ search, categoryId, status: newStatus })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search events..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={categoryId?.toString() ?? 'all'} onValueChange={handleCategoryChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id.toString()}>
              {cat.categoryName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={status ?? 'all'} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {Object.values(EVENT_STATUS).map((s) => (
            <SelectItem key={s} value={s}>
              {EVENT_STATUS_DISPLAY[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
