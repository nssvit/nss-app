'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'

export function UserProfileHeader() {
  const { currentUser, signOut } = useAuth()
  const [showMenu, setShowMenu] = useState(false)

  if (!currentUser) return null

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
          <span className="text-sm font-medium text-white">
            {currentUser.first_name[0]}{currentUser.last_name[0]}
          </span>
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-200">
            {currentUser.first_name} {currentUser.last_name}
          </p>
          <p className="text-xs text-gray-400">
            {currentUser.roles.join(', ') || 'Volunteer'}
          </p>
        </div>
        <i className="fas fa-chevron-down text-xs text-gray-400"></i>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-20">
            <div className="p-3 border-b border-gray-700">
              <p className="font-medium text-gray-200">
                {currentUser.first_name} {currentUser.last_name}
              </p>
              <p className="text-sm text-gray-400">{currentUser.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                Roll: {currentUser.roll_number}
              </p>
              {currentUser.roles.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {currentUser.roles.map((role) => (
                    <span
                      key={role}
                      className="px-2 py-1 text-xs bg-indigo-900/50 text-indigo-300 rounded"
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
                className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 rounded flex items-center space-x-2"
              >
                <i className="fas fa-user"></i>
                <span>View Profile</span>
              </button>
              <button
                onClick={() => {
                  setShowMenu(false)
                  // Navigate to settings page
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 rounded flex items-center space-x-2"
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
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700/50 rounded flex items-center space-x-2"
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