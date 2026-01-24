'use client'

import { useState } from 'react'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { useVolunteers } from '@/hooks/useVolunteers'
import Image from 'next/image'
import { getStatusBadgeClass } from '@/utils/styles/badges'
import { Skeleton } from './Skeleton'
import { EmptyState } from './EmptyState'
import { FilterBar, FilterSelect } from './FilterBar'
import { usePagination } from '@/hooks'

interface Volunteer {
  id: string
  name: string
  email: string
  phone: string
  year: string
  branch: string
  eventsParticipated: number
  totalHours: number
  status: 'Active' | 'Inactive' | 'Pending'
  joinDate: string
  avatar: string
  first_name: string
  last_name: string
  roll_number: string
}

export function VolunteersPage() {
  const layout = useResponsiveLayout()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([])

  const { volunteers, loading, error } = useVolunteers()

  // ... (loading and error states)

  const filteredVolunteers = volunteers.filter((volunteer) => {
    const fullName = `${volunteer.first_name} ${volunteer.last_name}`
    const matchesSearch =
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volunteer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volunteer.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volunteer.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || volunteer.status === statusFilter
    const matchesYear = !yearFilter || volunteer.year === yearFilter

    return matchesSearch && matchesStatus && matchesYear
  })

  const handleSelectVolunteer = (id: string) => {
    setSelectedVolunteers((prev) =>
      prev.includes(id) ? prev.filter((volunteerId) => volunteerId !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    setSelectedVolunteers(
      selectedVolunteers.length === filteredVolunteers.length
        ? []
        : filteredVolunteers.map((v) => v.id)
    )
  }

  // ... (clearFilters)

  return (
    <div
      className={`flex-1 overflow-x-hidden overflow-y-auto main-content-bg mobile-scroll safe-area-bottom ${layout.getContentPadding()}`}
    >
      {/* ... (Search and Filters) */}

      {/* ... (Action Bar) */}

      {/* Volunteers List */}
      <div className="card-glass rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-800/30 px-4 py-3 border-b border-gray-700/30">
          <div
            className={`grid ${layout.isMobile ? 'grid-cols-1' : 'grid-cols-8'} gap-4 items-center`}
          >
            {!layout.isMobile && (
              <>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="checkbox-custom"
                    checked={
                      selectedVolunteers.length === filteredVolunteers.length &&
                      filteredVolunteers.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                </div>
                <div className="col-span-2 text-sm font-medium text-gray-300">Name</div>
                <div className="text-sm font-medium text-gray-300">Year</div>
                <div className="text-sm font-medium text-gray-300">Branch</div>
                <div className="text-sm font-medium text-gray-300">Events</div>
                <div className="text-sm font-medium text-gray-300">Hours</div>
                <div className="text-sm font-medium text-gray-300">Status</div>
              </>
            )}
            {layout.isMobile && (
              <div className="text-sm font-medium text-gray-300">
                Volunteers ({filteredVolunteers.length})
              </div>
            )}
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-700/30">
          {filteredVolunteers.map((volunteer) => (
            <div key={volunteer.id} className="px-4 py-3 hover:bg-gray-800/20 transition-colors">
              {layout.isMobile ? (
                // Mobile Layout
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      className="checkbox-custom"
                      checked={selectedVolunteers.includes(volunteer.id)}
                      onChange={() => handleSelectVolunteer(volunteer.id)}
                    />
                    <Image
                      src={volunteer.avatar || '/icon-192x192.png'}
                      alt={`${volunteer.first_name} ${volunteer.last_name}`}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-200">
                        {volunteer.first_name} {volunteer.last_name}
                      </h4>
                      <p className="text-sm text-gray-400">{volunteer.email}</p>
                    </div>
                    <span className={getStatusBadgeClass(volunteer.status || 'Pending')}>
                      {volunteer.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Year:</span> {volunteer.year}
                    </div>
                    <div>
                      <span className="text-gray-500">Branch:</span> {volunteer.branch}
                    </div>
                    <div>
                      <span className="text-gray-500">Events:</span> {volunteer.eventsParticipated}
                    </div>
                    <div>
                      <span className="text-gray-500">Hours:</span> {volunteer.totalHours}
                    </div>
                  </div>
                </div>
              ) : (
                // Desktop Layout
                <div className="grid grid-cols-8 gap-4 items-center">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="checkbox-custom"
                      checked={selectedVolunteers.includes(volunteer.id)}
                      onChange={() => handleSelectVolunteer(volunteer.id)}
                    />
                  </div>
                  <div className="col-span-2 flex items-center space-x-3">
                    <Image
                      src={volunteer.avatar || '/icon-192x192.png'}
                      alt={`${volunteer.first_name} ${volunteer.last_name}`}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div className="font-medium text-gray-200 text-sm">
                        {volunteer.first_name} {volunteer.last_name}
                      </div>
                      <div className="text-xs text-gray-500">{volunteer.email}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-300">{volunteer.year}</div>
                  <div className="text-sm text-gray-300">{volunteer.branch}</div>
                  <div className="text-sm text-gray-300">{volunteer.eventsParticipated}</div>
                  <div className="text-sm text-gray-300">{volunteer.totalHours}</div>
                  <div>
                    <span className={getStatusBadgeClass(volunteer.status || 'Pending')}>
                      {volunteer.status}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-6 safe-area-bottom">
        <nav className={`flex ${layout.isMobile ? 'space-x-1' : 'space-x-2'}`}>
          <button
            className={`pagination-button ${layout.isMobile ? 'px-2 py-2 text-sm' : 'px-3 py-2 text-sm'} rounded-lg disabled:opacity-50 disabled:cursor-not-allowed pwa-button focus-visible`}
            disabled
          >
            {layout.isMobile ? '‹' : 'Previous'}
          </button>
          <button
            className={`pagination-button active ${layout.isMobile ? 'px-3 py-2 text-sm' : 'px-3 py-2 text-sm'} rounded-lg pwa-button focus-visible`}
          >
            1
          </button>
          <button
            className={`pagination-button ${layout.isMobile ? 'px-3 py-2 text-sm' : 'px-3 py-2 text-sm'} rounded-lg pwa-button focus-visible`}
          >
            2
          </button>
          <button
            className={`pagination-button ${layout.isMobile ? 'px-2 py-2 text-sm' : 'px-3 py-2 text-sm'} rounded-lg pwa-button focus-visible`}
          >
            {layout.isMobile ? '›' : 'Next'}
          </button>
        </nav>
      </div>
    </div>
  )
}
