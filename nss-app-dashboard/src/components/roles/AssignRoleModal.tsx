'use client'

/**
 * AssignRoleModal Component
 * Modal for assigning roles to volunteers
 */

import { useState, useEffect } from 'react'
import type { Role, UserRoleWithDetails, VolunteerBasic } from './types'

interface AssignRoleModalProps {
  isOpen: boolean
  onClose: () => void
  roleDefinitions: Role[]
  volunteers: VolunteerBasic[]
  existingRoles: UserRoleWithDetails[]
  onAssign: (volunteerId: string, roleId: string, expiresAt: string | null) => Promise<void>
}

export function AssignRoleModal({
  isOpen,
  onClose,
  roleDefinitions,
  volunteers,
  existingRoles,
  onAssign,
}: AssignRoleModalProps) {
  const [selectedVolunteer, setSelectedVolunteer] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredVolunteers = volunteers.filter((v) =>
    `${v.first_name} ${v.last_name} ${v.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const volunteerHasRole = (volunteerId: string, roleId: string) =>
    existingRoles.some(
      (ur) => ur.volunteer_id === volunteerId && ur.role_definition_id === roleId && ur.is_active
    )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVolunteer || !selectedRole || volunteerHasRole(selectedVolunteer, selectedRole))
      return
    setSubmitting(true)
    try {
      await onAssign(selectedVolunteer, selectedRole, expiresAt || null)
      setSelectedVolunteer('')
      setSelectedRole('')
      setExpiresAt('')
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!isOpen) {
      setSelectedVolunteer('')
      setSelectedRole('')
      setExpiresAt('')
      setSearchTerm('')
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl border border-gray-700/50 bg-gray-900/95 p-6 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-100">Assign Role</h2>
          <button
            onClick={onClose}
            className="p-1 text-2xl leading-none text-gray-500 hover:text-white"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Select Volunteer</label>
            <input
              type="text"
              placeholder="Search volunteers..."
              className="input-dark mb-2 w-full rounded-lg px-4 py-2 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              required
              className="input-dark w-full rounded-lg px-4 py-3 text-sm"
              value={selectedVolunteer}
              onChange={(e) => setSelectedVolunteer(e.target.value)}
            >
              <option value="">Select a volunteer...</option>
              {filteredVolunteers.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.first_name} {v.last_name} ({v.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Select Role</label>
            <select
              required
              className="input-dark w-full rounded-lg px-4 py-3 text-sm"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="">Select a role...</option>
              {roleDefinitions
                .filter((r) => r.is_active)
                .map((role) => (
                  <option
                    key={role.id}
                    value={role.id}
                    disabled={!!(selectedVolunteer && volunteerHasRole(selectedVolunteer, role.id))}
                  >
                    {role.display_name}{' '}
                    {selectedVolunteer && volunteerHasRole(selectedVolunteer, role.id)
                      ? '(Already assigned)'
                      : ''}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Expiration Date (Optional)
            </label>
            <input
              type="date"
              className="input-dark w-full rounded-lg px-4 py-3 text-sm"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="mt-1 text-xs text-gray-500">Leave empty for permanent assignment</p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="button-glass-secondary hover-lift rounded-lg px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedVolunteer || !selectedRole}
              className="button-glass-primary hover-lift rounded-lg px-4 py-2 text-sm disabled:opacity-50"
            >
              {submitting ? 'Assigning...' : 'Assign Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
