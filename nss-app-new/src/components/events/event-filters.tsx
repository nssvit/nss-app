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

export interface EventFilterValues {
  search: string
  categoryId: number | null
  status: string | null
  attendance: 'all' | 'attended' | 'not_attended'
}

interface EventFiltersProps {
  categories: EventCategory[]
  onFilterChange: (filters: EventFilterValues) => void
}

export function EventFilters({ categories, onFilterChange }: EventFiltersProps) {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [attendance, setAttendance] = useState<'all' | 'attended' | 'not_attended'>('all')

  function emit(overrides: Partial<EventFilterValues>) {
    onFilterChange({ search, categoryId, status, attendance, ...overrides })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search events..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            emit({ search: e.target.value })
          }}
          className="pl-9"
        />
      </div>
      <Select value={categoryId?.toString() ?? 'all'} onValueChange={(v) => {
        const val = v === 'all' ? null : Number(v)
        setCategoryId(val)
        emit({ categoryId: val })
      }}>
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
      <Select value={status ?? 'all'} onValueChange={(v) => {
        const val = v === 'all' ? null : v
        setStatus(val)
        emit({ status: val })
      }}>
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
      <Select value={attendance} onValueChange={(v) => {
        const val = v as 'all' | 'attended' | 'not_attended'
        setAttendance(val)
        emit({ attendance: val })
      }}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="My Attendance" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Events</SelectItem>
          <SelectItem value="attended">Attended</SelectItem>
          <SelectItem value="not_attended">Not Attended</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
