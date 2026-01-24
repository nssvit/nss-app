'use client'

/**
 * ViewUserModal Component
 * Modal for viewing user details
 */

import Image from 'next/image'
import type { Volunteer } from './types'

interface ViewUserModalProps {
  isOpen: boolean
  onClose: () => void
  volunteer: Volunteer | null
  roles: string[]
}

export function ViewUserModal({ isOpen, onClose, volunteer, roles }: ViewUserModalProps) {
  if (!isOpen || !volunteer) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 p-6 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-100">User Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-2xl leading-none p-1"
          >
            &times;
          </button>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <Image
            src={volunteer.avatar || '/icon-192x192.png'}
            alt={`${volunteer.first_name} ${volunteer.last_name}`}
            width={80}
            height={80}
            className="w-20 h-20 rounded-full"
          />
          <div>
            <h3 className="text-xl font-semibold text-gray-100">
              {volunteer.first_name} {volunteer.last_name}
            </h3>
            <p className="text-gray-400">{volunteer.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {roles.map((role) => (
                <span
                  key={role}
                  className="text-xs px-2 py-1 rounded-full bg-blue-900/30 text-blue-400"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Roll Number</p>
            <p className="text-gray-200">{volunteer.roll_number || volunteer.rollNumber}</p>
          </div>
          <div>
            <p className="text-gray-500">Branch</p>
            <p className="text-gray-200">{volunteer.branch}</p>
          </div>
          <div>
            <p className="text-gray-500">Year</p>
            <p className="text-gray-200">{volunteer.year}</p>
          </div>
          <div>
            <p className="text-gray-500">Phone</p>
            <p className="text-gray-200">{volunteer.phone_no || 'Not set'}</p>
          </div>
          <div>
            <p className="text-gray-500">Gender</p>
            <p className="text-gray-200">{volunteer.gender || 'Not set'}</p>
          </div>
          <div>
            <p className="text-gray-500">NSS Join Year</p>
            <p className="text-gray-200">{volunteer.nss_join_year || 'Not set'}</p>
          </div>
          <div>
            <p className="text-gray-500">Status</p>
            <p className={volunteer.is_active ? 'text-green-400' : 'text-red-400'}>
              {volunteer.is_active ? 'Active' : 'Inactive'}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Joined</p>
            <p className="text-gray-200">{volunteer.joinDate}</p>
          </div>
          <div>
            <p className="text-gray-500">Events Participated</p>
            <p className="text-gray-200">{volunteer.eventsParticipated || 0}</p>
          </div>
          <div>
            <p className="text-gray-500">Total Hours</p>
            <p className="text-gray-200">{volunteer.totalHours || 0}</p>
          </div>
        </div>

        {volunteer.address && (
          <div className="mt-4">
            <p className="text-gray-500 text-sm">Address</p>
            <p className="text-gray-200 text-sm">{volunteer.address}</p>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="button-glass-secondary hover-lift px-4 py-2 text-sm rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
