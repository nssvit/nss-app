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
  const [formData, setFormData] = useState({ first_name: '', last_name: '', phone_no: '', address: '', is_active: true })
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 p-6 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-100">Edit User</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none p-1">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
              <input type="text" required className="input-dark w-full text-sm rounded-lg px-4 py-3"
                value={formData.first_name} onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
              <input type="text" required className="input-dark w-full text-sm rounded-lg px-4 py-3"
                value={formData.last_name} onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
            <input type="tel" className="input-dark w-full text-sm rounded-lg px-4 py-3"
              value={formData.phone_no} onChange={(e) => setFormData((prev) => ({ ...prev, phone_no: e.target.value }))} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
            <textarea className="input-dark w-full text-sm rounded-lg px-4 py-3 resize-none" rows={2}
              value={formData.address} onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))} />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" checked={formData.is_active}
              onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))} className="w-4 h-4 rounded" />
            <label htmlFor="is_active" className="text-sm text-gray-300">Active</label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="button-glass-secondary hover-lift px-4 py-2 text-sm rounded-lg">Cancel</button>
            <button type="submit" disabled={submitting} className="button-glass-primary hover-lift px-4 py-2 text-sm rounded-lg disabled:opacity-50">
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
