'use client'

/**
 * RoleDefinitionModal Component
 * Modal for creating/editing role definitions
 */

import { useState, useEffect } from 'react'
import type { Role } from './types'

interface RoleDefinitionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<Role>) => Promise<void>
  initialData?: Role
  mode: 'create' | 'edit'
}

export function RoleDefinitionModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: RoleDefinitionModalProps) {
  const [formData, setFormData] = useState({
    role_name: '',
    display_name: '',
    description: '',
    hierarchy_level: 10,
    is_active: true,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        role_name: initialData.role_name,
        display_name: initialData.display_name,
        description: initialData.description || '',
        hierarchy_level: initialData.hierarchy_level,
        is_active: initialData.is_active,
      })
    } else {
      setFormData({
        role_name: '',
        display_name: '',
        description: '',
        hierarchy_level: 10,
        is_active: true,
      })
    }
  }, [initialData, mode, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit({
        ...formData,
        role_name: formData.role_name.toLowerCase().replace(/\s+/g, '_'),
        permissions: {},
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl border border-gray-700/50 bg-gray-900/95 p-6 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-100">
            {mode === 'create' ? 'Create Role' : 'Edit Role'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-2xl leading-none text-gray-500 hover:text-white"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Role Name (Internal)
            </label>
            <input
              type="text"
              required
              className="input-dark w-full rounded-lg px-4 py-3 text-sm"
              placeholder="e.g., event_lead"
              value={formData.role_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, role_name: e.target.value }))}
              disabled={mode === 'edit'}
            />
            <p className="mt-1 text-xs text-gray-500">
              Lowercase with underscores, cannot be changed after creation
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Display Name</label>
            <input
              type="text"
              required
              className="input-dark w-full rounded-lg px-4 py-3 text-sm"
              placeholder="e.g., Event Lead"
              value={formData.display_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, display_name: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Description</label>
            <textarea
              className="input-dark w-full resize-none rounded-lg px-4 py-3 text-sm"
              rows={3}
              placeholder="Describe the role responsibilities..."
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Hierarchy Level</label>
            <input
              type="number"
              required
              min={1}
              max={100}
              className="input-dark w-full rounded-lg px-4 py-3 text-sm"
              value={formData.hierarchy_level}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  hierarchy_level: parseInt(e.target.value) || 10,
                }))
              }
            />
            <p className="mt-1 text-xs text-gray-500">
              Lower number = higher priority (1 = Admin, 10 = Default)
            </p>
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
              {submitting ? 'Saving...' : mode === 'create' ? 'Create Role' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
