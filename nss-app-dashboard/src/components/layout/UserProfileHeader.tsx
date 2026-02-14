'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function UserProfileHeader() {
  const { currentUser, signOut } = useAuth()
  const [showMenu, setShowMenu] = useState(false)

  if (!currentUser) return null

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center space-x-2 rounded-lg p-2 transition-colors hover:bg-gray-700/50"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500">
          <span className="text-sm font-medium text-white">
            {currentUser.first_name[0]}
            {currentUser.last_name[0]}
          </span>
        </div>
        <div className="hidden text-left md:block">
          <p className="text-sm font-medium text-gray-200">
            {currentUser.first_name} {currentUser.last_name}
          </p>
          <p className="text-xs text-gray-400">{currentUser.roles.join(', ') || 'Volunteer'}</p>
        </div>
        <i className="fas fa-chevron-down text-xs text-gray-400"></i>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute top-full right-0 z-20 mt-2 w-64 rounded-lg border border-gray-700 bg-gray-800 shadow-xl">
            <div className="border-b border-gray-700 p-3">
              <p className="font-medium text-gray-200">
                {currentUser.first_name} {currentUser.last_name}
              </p>
              <p className="text-sm text-gray-400">{currentUser.email}</p>
              <p className="mt-1 text-xs text-gray-500">Roll: {currentUser.roll_number}</p>
              {currentUser.roles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {currentUser.roles.map((role) => (
                    <span
                      key={role}
                      className="rounded bg-indigo-900/50 px-2 py-1 text-xs text-indigo-300"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  setShowMenu(false)
                  // Navigate to profile page
                }}
                className="flex w-full items-center space-x-2 rounded px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50"
              >
                <i className="fas fa-user"></i>
                <span>View Profile</span>
              </button>
              <button
                onClick={() => {
                  setShowMenu(false)
                  // Navigate to settings page
                }}
                className="flex w-full items-center space-x-2 rounded px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50"
              >
                <i className="fas fa-cog"></i>
                <span>Settings</span>
              </button>
              <hr className="my-2 border-gray-700" />
              <button
                onClick={() => {
                  setShowMenu(false)
                  signOut()
                }}
                className="flex w-full items-center space-x-2 rounded px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700/50"
              >
                <i className="fas fa-sign-out-alt"></i>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
