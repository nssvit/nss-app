'use client'

import { ReactNode } from 'react'

interface FilterBarProps {
  children: ReactNode
  onClear?: () => void
  showClear?: boolean
  className?: string
  isMobile?: boolean
}

export function FilterBar({
  children,
  onClear,
  showClear = true,
  className = '',
  isMobile = false
}: FilterBarProps) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${isMobile ? 'px-0' : 'px-1'} ${className}`}>
      {children}

      {showClear && onClear && (
        <button
          className="btn btn-sm btn-ghost"
          onClick={onClear}
        >
          Clear
        </button>
      )}
    </div>
  )
}

// Filter Select Component
interface FilterSelectProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  className?: string
}

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = ''
}: FilterSelectProps) {
  return (
    <select
      className={`input-dark text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible flex-1 min-w-0 ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

// Filter Button Component
interface FilterButtonProps {
  onClick?: () => void
  icon?: string
  label?: string
  active?: boolean
}

export function FilterButton({
  onClick,
  icon = 'fa-filter',
  label,
  active = false
}: FilterButtonProps) {
  return (
    <button
      className={`btn btn-sm ${active ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
      onClick={onClick}
    >
      <i className={`fas ${icon} fa-sm`}></i>
      {label && <span>{label}</span>}
    </button>
  )
}
