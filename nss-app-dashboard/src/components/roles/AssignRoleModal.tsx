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
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 p-6 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-100">Assign Role</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-2xl leading-none p-1"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Volunteer</label>
            <input
              type="text"
              placeholder="Search volunteers..."
              className="input-dark w-full text-sm rounded-lg px-4 py-2 mb-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              required
              className="input-dark w-full text-sm rounded-lg px-4 py-3"
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Role</label>
            <select
              required
              className="input-dark w-full text-sm rounded-lg px-4 py-3"
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Expiration Date (Optional)
            </label>
            <input
              type="date"
              className="input-dark w-full text-sm rounded-lg px-4 py-3"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for permanent assignment</p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="button-glass-secondary hover-lift px-4 py-2 text-sm rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedVolunteer || !selectedRole}
              className="button-glass-primary hover-lift px-4 py-2 text-sm rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Assigning...' : 'Assign Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
