'use client'

/**
 * ProfileForm Component
 * Personal information edit form
 */

import type { ProfileData } from './types'

interface ProfileFormProps {
  profileData: ProfileData
  errors: Record<string, string>
  saving: boolean
  onFieldChange: (field: keyof ProfileData, value: string | number) => void
  onSave: () => void
}

export function ProfileForm({
  profileData,
  errors,
  saving,
  onFieldChange,
  onSave,
}: ProfileFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-100">Personal Information</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">First Name</label>
            <input
              type="text"
              value={profileData.firstName}
              onChange={(e) => onFieldChange('firstName', e.target.value)}
              className={`input-dark focus-visible w-full rounded-lg px-3 py-2 text-sm focus:outline-none ${errors.firstName ? 'border-2 border-red-500' : ''}`}
            />
            {errors.firstName && <p className="mt-1 text-xs text-red-400">{errors.firstName}</p>}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Last Name</label>
            <input
              type="text"
              value={profileData.lastName}
              onChange={(e) => onFieldChange('lastName', e.target.value)}
              className={`input-dark focus-visible w-full rounded-lg px-3 py-2 text-sm focus:outline-none ${errors.lastName ? 'border-2 border-red-500' : ''}`}
            />
            {errors.lastName && <p className="mt-1 text-xs text-red-400">{errors.lastName}</p>}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Email Address</label>
            <input
              type="email"
              value={profileData.email}
              disabled
              className="input-dark w-full cursor-not-allowed rounded-lg px-3 py-2 text-sm opacity-60 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Phone Number</label>
            <input
              type="tel"
              value={profileData.phoneNo}
              onChange={(e) => onFieldChange('phoneNo', e.target.value)}
              className={`input-dark focus-visible w-full rounded-lg px-3 py-2 text-sm focus:outline-none ${errors.phoneNo ? 'border-2 border-red-500' : ''}`}
            />
            {errors.phoneNo && <p className="mt-1 text-xs text-red-400">{errors.phoneNo}</p>}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Roll Number</label>
            <input
              type="text"
              value={profileData.rollNumber}
              disabled
              className="input-dark w-full cursor-not-allowed rounded-lg px-3 py-2 text-sm opacity-60 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Branch</label>
            <input
              type="text"
              value={profileData.branch}
              disabled
              className="input-dark w-full cursor-not-allowed rounded-lg px-3 py-2 text-sm opacity-60 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Gender</label>
            <select
              value={profileData.gender}
              onChange={(e) => onFieldChange('gender', e.target.value)}
              className="input-dark focus-visible w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Date of Birth</label>
            <input
              type="date"
              value={profileData.birthDate?.split('T')[0] || ''}
              disabled
              className="input-dark w-full cursor-not-allowed rounded-lg px-3 py-2 text-sm opacity-60 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">Address</label>
        <textarea
          value={profileData.address}
          onChange={(e) => onFieldChange('address', e.target.value)}
          rows={3}
          className="input-dark focus-visible w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
          placeholder="Enter your address..."
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="pwa-button button-glass-primary hover-lift focus-visible flex items-center space-x-2 rounded-lg px-6 py-2 text-sm font-medium disabled:opacity-50"
        >
          {saving ? (
            <i className="fas fa-spinner fa-spin fa-sm"></i>
          ) : (
            <i className="fas fa-save fa-sm"></i>
          )}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  )
}
