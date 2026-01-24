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

export function ProfileForm({ profileData, errors, saving, onFieldChange, onSave }: ProfileFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
            <input
              type="text"
              value={profileData.firstName}
              onChange={(e) => onFieldChange('firstName', e.target.value)}
              className={`input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible ${errors.firstName ? 'border-2 border-red-500' : ''}`}
            />
            {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
            <input
              type="text"
              value={profileData.lastName}
              onChange={(e) => onFieldChange('lastName', e.target.value)}
              className={`input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible ${errors.lastName ? 'border-2 border-red-500' : ''}`}
            />
            {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <input
              type="email"
              value={profileData.email}
              disabled
              className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
            <input
              type="tel"
              value={profileData.phoneNo}
              onChange={(e) => onFieldChange('phoneNo', e.target.value)}
              className={`input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible ${errors.phoneNo ? 'border-2 border-red-500' : ''}`}
            />
            {errors.phoneNo && <p className="text-red-400 text-xs mt-1">{errors.phoneNo}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Roll Number</label>
            <input
              type="text"
              value={profileData.rollNumber}
              disabled
              className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none opacity-60 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Branch</label>
            <input
              type="text"
              value={profileData.branch}
              disabled
              className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none opacity-60 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
            <select
              value={profileData.gender}
              onChange={(e) => onFieldChange('gender', e.target.value)}
              className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Date of Birth</label>
            <input
              type="date"
              value={profileData.birthDate?.split('T')[0] || ''}
              disabled
              className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none opacity-60 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
        <textarea
          value={profileData.address}
          onChange={(e) => onFieldChange('address', e.target.value)}
          rows={3}
          className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
          placeholder="Enter your address..."
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="pwa-button button-glass-primary hover-lift flex items-center space-x-2 px-6 py-2 rounded-lg text-sm font-medium focus-visible disabled:opacity-50"
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
