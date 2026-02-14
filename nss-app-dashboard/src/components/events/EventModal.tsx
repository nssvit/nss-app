'use client'

/**
 * EventModal Component
 * Uses Server Actions via useVolunteers hook (full Drizzle consistency)
 */

import { useState, useEffect } from 'react'
import { useVolunteers } from '@/hooks/useVolunteers'

interface Volunteer {
  id: string
  firstName: string
  lastName: string
  rollNumber: string
  email: string
}

interface EventFormData {
  eventName: string
  eventDate: string
  declaredHours: string
  eventCategory: string
  academicSession: string
  eventLocation: string
  eventDescription: string
  minParticipants?: string
  maxParticipants?: string
  registrationDeadline?: string
  selectedVolunteers?: string[]
}

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (eventData: EventFormData) => void
  title?: string
  initialData?: EventFormData
  categories?: string[]
}

export function EventModal({
  isOpen,
  onClose,
  onSubmit,
  title = 'Create New Event',
  initialData,
  categories = [],
}: EventModalProps) {
  const [formData, setFormData] = useState({
    eventName: '',
    eventDate: '',
    declaredHours: '',
    eventCategory: '',
    academicSession: '',
    eventLocation: '',
    eventDescription: '',
    minParticipants: '',
    maxParticipants: '',
    registrationDeadline: '',
    selectedVolunteers: [] as string[],
  })

  // Use hook for volunteers data (Server Actions -> Drizzle)
  const { volunteers: rawVolunteers, loading: loadingVolunteers } = useVolunteers()
  const [searchTerm, setSearchTerm] = useState('')
  const [showVolunteerSection, setShowVolunteerSection] = useState(false)

  // Transform volunteers to expected format
  const volunteers: Volunteer[] = (rawVolunteers || []).map((v: any) => ({
    id: v.id || v.volunteer_id,
    firstName: v.firstName || v.first_name || '',
    lastName: v.lastName || v.last_name || '',
    rollNumber: v.rollNumber || v.roll_number || '',
    email: v.email || '',
  }))

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        minParticipants: initialData.minParticipants || '',
        maxParticipants: initialData.maxParticipants || '',
        registrationDeadline: initialData.registrationDeadline || '',
        selectedVolunteers: initialData.selectedVolunteers || [],
      })
    } else {
      setFormData({
        eventName: '',
        eventDate: '',
        declaredHours: '',
        eventCategory: '',
        academicSession: '',
        eventLocation: '',
        eventDescription: '',
        minParticipants: '',
        maxParticipants: '',
        registrationDeadline: '',
        selectedVolunteers: [],
      })
    }
  }, [initialData, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('EventModal: Form submitted with data:', formData)
    onSubmit(formData)
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const toggleVolunteerSelection = (volunteerId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedVolunteers: prev.selectedVolunteers?.includes(volunteerId)
        ? prev.selectedVolunteers.filter((id) => id !== volunteerId)
        : [...(prev.selectedVolunteers || []), volunteerId],
    }))
  }

  const selectAllVolunteers = () => {
    const filtered = filteredVolunteers.map((v) => v.id)
    setFormData((prev) => ({
      ...prev,
      selectedVolunteers: filtered,
    }))
  }

  const deselectAllVolunteers = () => {
    setFormData((prev) => ({
      ...prev,
      selectedVolunteers: [],
    }))
  }

  const filteredVolunteers = volunteers.filter((v) =>
    `${v.firstName} ${v.lastName} ${v.rollNumber} ${v.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      onClick={handleBackdropClick}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-700/50 bg-gray-900/95 p-6 shadow-2xl backdrop-blur-xl md:p-5">
        <div className="mb-6 flex items-center justify-between md:mb-4">
          <h2 className="text-xl font-semibold text-gray-100 md:text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="pwa-button focus-visible rounded p-2 text-3xl leading-none text-gray-500 transition-colors hover:text-white md:p-1 md:text-2xl"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-4">
          <div>
            <label
              htmlFor="eventName"
              className="mb-3 block text-base font-medium text-gray-300 md:mb-2 md:text-sm"
            >
              Event Name
            </label>
            <input
              type="text"
              id="eventName"
              name="eventName"
              required
              className="input-dark focus-visible w-full rounded-lg px-4 py-4 text-base focus:outline-none md:py-3 md:text-sm"
              placeholder="e.g., Tree Plantation Drive"
              value={formData.eventName}
              onChange={handleInputChange}
            />
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-4">
            <div>
              <label
                htmlFor="eventDate"
                className="mb-3 block text-base font-medium text-gray-300 md:mb-2 md:text-sm"
              >
                Event Date
              </label>
              <input
                type="date"
                id="eventDate"
                name="eventDate"
                required
                className="input-dark focus-visible w-full rounded-lg px-4 py-4 text-base focus:outline-none md:py-3 md:text-sm"
                value={formData.eventDate}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label
                htmlFor="declaredHours"
                className="mb-3 block text-base font-medium text-gray-300 md:mb-2 md:text-sm"
              >
                Declared Hours
              </label>
              <input
                type="number"
                id="declaredHours"
                name="declaredHours"
                required
                min="1"
                className="input-dark focus-visible w-full rounded-lg px-4 py-4 text-base focus:outline-none md:py-3 md:text-sm"
                placeholder="e.g., 4"
                value={formData.declaredHours}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-4">
            <div>
              <label
                htmlFor="eventCategory"
                className="mb-3 block text-base font-medium text-gray-300 md:mb-2 md:text-sm"
              >
                Category
              </label>
              <select
                id="eventCategory"
                name="eventCategory"
                required
                className="input-dark focus-visible w-full rounded-lg px-4 py-4 text-base focus:outline-none md:py-3 md:text-sm"
                value={formData.eventCategory}
                onChange={handleInputChange}
              >
                <option value="">Select Category...</option>
                {categories.length > 0 ? (
                  categories.map((category, index) => (
                    <option key={`modal-cat-${index}`} value={category}>
                      {category}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Area Based - 1">Area Based - 1</option>
                    <option value="College Event">College Event</option>
                    <option value="Camp">Camp</option>
                    <option value="Workshop">Workshop</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label
                htmlFor="academicSession"
                className="mb-3 block text-base font-medium text-gray-300 md:mb-2 md:text-sm"
              >
                Academic Session
              </label>
              <input
                type="text"
                id="academicSession"
                name="academicSession"
                required
                className="input-dark focus-visible w-full rounded-lg px-4 py-4 text-base focus:outline-none md:py-3 md:text-sm"
                placeholder="e.g., 2024-2025"
                value={formData.academicSession}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="eventLocation"
              className="mb-3 block text-base font-medium text-gray-300 md:mb-2 md:text-sm"
            >
              Location (Optional)
            </label>
            <input
              type="text"
              id="eventLocation"
              name="eventLocation"
              className="input-dark focus-visible w-full rounded-lg px-4 py-4 text-base focus:outline-none md:py-3 md:text-sm"
              placeholder="e.g., Juhu Beach, Mumbai"
              value={formData.eventLocation}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label
              htmlFor="eventDescription"
              className="mb-3 block text-base font-medium text-gray-300 md:mb-2 md:text-sm"
            >
              Description
            </label>
            <textarea
              id="eventDescription"
              name="eventDescription"
              rows={5}
              className="input-dark focus-visible mobile-scroll w-full resize-none rounded-lg px-4 py-4 text-base focus:outline-none md:py-3 md:text-sm"
              placeholder="Provide a detailed description of the event..."
              value={formData.eventDescription}
              onChange={handleInputChange}
            ></textarea>
          </div>

          {/* Volunteer Selection Section */}
          <div className="border-t border-gray-700/30 pt-6 md:pt-4">
            <div className="mb-4 flex items-center justify-between">
              <label className="block text-base font-medium text-gray-300 md:text-sm">
                Mark Attendance ({formData.selectedVolunteers?.length || 0} selected)
              </label>
              <button
                type="button"
                onClick={() => setShowVolunteerSection(!showVolunteerSection)}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                {showVolunteerSection ? 'Hide' : 'Show'} Volunteers
              </button>
            </div>

            {showVolunteerSection && (
              <div className="space-y-3">
                {/* Search and Actions */}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    placeholder="Search volunteers..."
                    className="input-dark flex-1 rounded-lg px-3 py-2 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllVolunteers}
                      className="btn btn-sm btn-secondary whitespace-nowrap"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={deselectAllVolunteers}
                      className="btn btn-sm btn-secondary whitespace-nowrap"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {/* Volunteers List */}
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-gray-700/30 p-3">
                  {loadingVolunteers ? (
                    <p className="py-4 text-center text-sm text-gray-400">Loading volunteers...</p>
                  ) : filteredVolunteers.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-400">No volunteers found</p>
                  ) : (
                    filteredVolunteers.map((volunteer, index) => (
                      <label
                        key={`vol-${volunteer.id || index}`}
                        className="flex cursor-pointer items-center gap-3 rounded p-2 hover:bg-gray-800/30"
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedVolunteers?.includes(volunteer.id) || false}
                          onChange={() => toggleVolunteerSelection(volunteer.id)}
                          className="h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-200">
                            {volunteer.firstName} {volunteer.lastName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {volunteer.rollNumber} • {volunteer.email}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="safe-area-bottom flex flex-col justify-end space-y-3 pt-6 sm:flex-row sm:space-y-0 sm:space-x-3 md:pt-4">
            <button
              type="button"
              onClick={onClose}
              className="pwa-button button-glass-secondary hover-lift focus-visible rounded-lg px-6 py-4 text-base font-medium md:py-3 md:text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="pwa-button button-glass-primary hover-lift focus-visible rounded-lg px-6 py-4 text-base font-medium md:py-3 md:text-sm"
            >
              Save Event
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
