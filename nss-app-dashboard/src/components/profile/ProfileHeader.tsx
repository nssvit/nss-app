'use client'

/**
 * ProfileHeader Component
 * Displays avatar, name, and basic info
 */

import { useRef } from 'react'
import Image from 'next/image'
import type { ProfileData } from './types'

interface ProfileHeaderProps {
  profileData: ProfileData
  roles: string[]
  isMobile: boolean
  uploading: boolean
  onAvatarChange: (file: File) => void
}

export function ProfileHeader({
  profileData,
  roles,
  isMobile,
  uploading,
  onAvatarChange,
}: ProfileHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onAvatarChange(file)
  }

  const getRoleDisplay = () => {
    if (!roles?.length) return 'Volunteer'
    if (roles.includes('admin')) return 'Administrator'
    if (roles.includes('program_officer')) return 'Program Officer'
    if (roles.includes('documentation_lead')) return 'Documentation Lead'
    if (roles.includes('event_lead')) return 'Event Lead'
    return 'Volunteer'
  }

  return (
    <div className="card-glass rounded-xl p-6 mb-6">
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} items-center gap-6`}>
        <div className="relative">
          {profileData.profilePic ? (
            <Image
              src={profileData.profilePic}
              alt="Profile Picture"
              width={isMobile ? 96 : 128}
              height={isMobile ? 96 : 128}
              className={`${isMobile ? 'w-24 h-24' : 'w-32 h-32'} rounded-full border-4 border-gray-700/50 object-cover`}
            />
          ) : (
            <div
              className={`${isMobile ? 'w-24 h-24' : 'w-32 h-32'} rounded-full border-4 border-gray-700/50 bg-indigo-600 flex items-center justify-center`}
            >
              <span className="text-3xl font-bold text-white">
                {profileData.firstName?.charAt(0)}
                {profileData.lastName?.charAt(0)}
              </span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleAvatarClick}
            disabled={uploading}
            className="absolute bottom-0 right-0 pwa-button bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-lg focus-visible disabled:opacity-50"
          >
            {uploading ? (
              <i className="fas fa-spinner fa-spin text-sm"></i>
            ) : (
              <i className="fas fa-camera text-sm"></i>
            )}
          </button>
        </div>

        <div className={`flex-1 ${isMobile ? 'text-center' : 'text-left'}`}>
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-100 mb-2`}>
            {profileData.firstName} {profileData.lastName}
          </h1>
          <p className="text-lg text-gray-300 mb-2">{getRoleDisplay()}</p>
          <p className="text-sm text-gray-400 mb-4">
            {profileData.branch} - Year {profileData.year} | {profileData.rollNumber}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap justify-center md:justify-start">
            {profileData.nssJoinYear > 0 && (
              <span>
                <i className="fas fa-calendar mr-1"></i> NSS since {profileData.nssJoinYear}
              </span>
            )}
            <span>
              <i className="fas fa-envelope mr-1"></i> {profileData.email}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
