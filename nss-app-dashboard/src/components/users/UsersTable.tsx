'use client'

/**
 * UsersTable Component
 * Table displaying users list
 */

import Image from 'next/image'
import { Skeleton } from '../Skeleton'
import type { Volunteer } from './types'

interface UsersTableProps {
  users: Volunteer[]
  selectedUsers: string[]
  loading: boolean
  isMobile: boolean
  isAdmin: boolean
  getPrimaryRole: (id: string) => string
  onSelectUser: (id: string) => void
  onSelectAll: () => void
  onView: (user: Volunteer) => void
  onEdit: (user: Volunteer) => void
  onToggleActive: (user: Volunteer) => void
  onDelete: (user: Volunteer) => void
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'admin': return 'text-red-400 bg-red-900/30'
    case 'program_officer': return 'text-blue-400 bg-blue-900/30'
    case 'event_lead':
    case 'documentation_lead': return 'text-purple-400 bg-purple-900/30'
    default: return 'text-green-400 bg-green-900/30'
  }
}

const getStatusColor = (isActive: boolean) => isActive ? 'text-green-400 bg-green-900/30' : 'text-red-400 bg-red-900/30'

export function UsersTable({ users, selectedUsers, loading, isMobile, isAdmin, getPrimaryRole,
  onSelectUser, onSelectAll, onView, onEdit, onToggleActive, onDelete }: UsersTableProps) {
  if (loading) {
    return (
      <div className="divide-y divide-gray-700/30">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="px-4 py-3"><Skeleton className="h-12 w-full rounded-lg" /></div>)}
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-gray-400">
        <i className="fas fa-users text-4xl mb-3"></i>
        <p>No users found</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-700/30">
      {users.map((volunteer) => {
        const displayName = `${volunteer.first_name} ${volunteer.last_name}`
        const avatar = volunteer.avatar || '/icon-192x192.png'
        const primaryRole = getPrimaryRole(volunteer.id)

        return (
          <div key={volunteer.id} className="px-4 py-3 hover:bg-gray-800/20 transition-colors">
            {isMobile ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input type="checkbox" className="checkbox-custom" checked={selectedUsers.includes(volunteer.id)} onChange={() => onSelectUser(volunteer.id)} />
                  <Image src={avatar} alt={displayName} width={40} height={40} className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-200">{displayName}</h4>
                    <p className="text-sm text-gray-400">{volunteer.email}</p>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(primaryRole)}`}>{primaryRole}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(volunteer.is_active)}`}>{volunteer.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{volunteer.totalHours || 0} hours</span>
                  <div className="flex space-x-2">
                    <button onClick={() => onEdit(volunteer)} className="text-gray-400 hover:text-blue-400 p-1"><i className="fas fa-edit text-sm"></i></button>
                    <button onClick={() => onView(volunteer)} className="text-gray-400 hover:text-green-400 p-1"><i className="fas fa-eye text-sm"></i></button>
                    <button onClick={() => onToggleActive(volunteer)} className="text-gray-400 hover:text-yellow-400 p-1">
                      <i className={`fas fa-${volunteer.is_active ? 'ban' : 'check-circle'} text-sm`}></i>
                    </button>
                    {isAdmin && <button onClick={() => onDelete(volunteer)} className="text-gray-400 hover:text-red-600 p-1"><i className="fas fa-trash text-sm"></i></button>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-4 items-center">
                <div><input type="checkbox" className="checkbox-custom" checked={selectedUsers.includes(volunteer.id)} onChange={() => onSelectUser(volunteer.id)} /></div>
                <div className="col-span-2 flex items-center space-x-3">
                  <Image src={avatar} alt={displayName} width={32} height={32} className="w-8 h-8 rounded-full" />
                  <div>
                    <div className="font-medium text-gray-200 text-sm">{displayName}</div>
                    <div className="text-xs text-gray-500">{volunteer.email}</div>
                  </div>
                </div>
                <div><span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(primaryRole)}`}>{primaryRole}</span></div>
                <div><span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(volunteer.is_active)}`}>{volunteer.is_active ? 'Active' : 'Inactive'}</span></div>
                <div className="text-sm text-gray-300">{volunteer.totalHours || 0} hrs</div>
                <div className="flex space-x-2">
                  <button onClick={() => onEdit(volunteer)} className="text-gray-400 hover:text-blue-400 p-1 rounded" title="Edit"><i className="fas fa-edit text-sm"></i></button>
                  <button onClick={() => onView(volunteer)} className="text-gray-400 hover:text-green-400 p-1 rounded" title="View"><i className="fas fa-eye text-sm"></i></button>
                  <button onClick={() => onToggleActive(volunteer)} className="text-gray-400 hover:text-yellow-400 p-1 rounded" title={volunteer.is_active ? 'Deactivate' : 'Reactivate'}>
                    <i className={`fas fa-${volunteer.is_active ? 'ban' : 'check-circle'} text-sm`}></i>
                  </button>
                  {isAdmin && <button onClick={() => onDelete(volunteer)} className="text-gray-400 hover:text-red-600 p-1 rounded" title="Delete"><i className="fas fa-trash text-sm"></i></button>}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
