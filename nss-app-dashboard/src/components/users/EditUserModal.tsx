'use client'

/**
 * EditUserModal Component
 * Modal for editing user details
 */

import { useState, useEffect } from 'react'
import type { Volunteer } from './types'

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  volunteer: Volunteer | null
  onSave: (updates: Partial<Volunteer>) => Promise<void>
}

export function EditUserModal({ isOpen, onClose, volunteer, onSave }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_no: '',
    address: '',
    is_active: true,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (volunteer) {
      setFormData({
        first_name: volunteer.first_name,
        last_name: volunteer.last_name,
        phone_no: volunteer.phone_no || '',
        address: volunteer.address || '',
        is_active: volunteer.is_active,
      })
    }
  }, [volunteer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSave(formData)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen || !volunteer) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl border border-gray-700/50 bg-gray-900/95 p-6 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-100">Edit User</h2>
          <button
            onClick={onClose}
            className="p-1 text-2xl leading-none text-gray-500 hover:text-white"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">First Name</label>
              <input
                type="text"
                required
                className="input-dark w-full rounded-lg px-4 py-3 text-sm"
                value={formData.first_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Last Name</label>
              <input
                type="text"
                required
                className="input-dark w-full rounded-lg px-4 py-3 text-sm"
                value={formData.last_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Phone Number</label>
            <input
              type="tel"
              className="input-dark w-full rounded-lg px-4 py-3 text-sm"
              value={formData.phone_no}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone_no: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Address</label>
            <textarea
              className="input-dark w-full resize-none rounded-lg px-4 py-3 text-sm"
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
              className="h-4 w-4 rounded"
            />
            <label htmlFor="is_active" className="text-sm text-gray-300">
              Active
            </label>
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
              disabled={submitting}
              className="button-glass-primary hover-lift rounded-lg px-4 py-2 text-sm disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
