'use client'

/**
 * RoleAssignmentsTable Component
 * Table displaying role assignments
 */

import Image from 'next/image'
import { Skeleton } from '@/components/ui'
import type { UserRoleWithDetails } from './types'

interface RoleAssignmentsTableProps {
  userRoles: UserRoleWithDetails[]
  loading: boolean
  isMobile: boolean
  onRevoke: (userRoleId: string) => void
}

const getRoleColor = (roleName: string) => {
  switch (roleName) {
    case 'admin':
      return 'text-red-400 bg-red-900/30'
    case 'program_officer':
      return 'text-blue-400 bg-blue-900/30'
    case 'event_lead':
    case 'documentation_lead':
      return 'text-purple-400 bg-purple-900/30'
    case 'volunteer':
      return 'text-green-400 bg-green-900/30'
    default:
      return 'text-gray-400 bg-gray-900/30'
  }
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export function RoleAssignmentsTable({
  userRoles,
  loading,
  isMobile,
  onRevoke,
}: RoleAssignmentsTableProps) {
  if (loading) {
    return (
      <div className="divide-y divide-gray-700/30">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-4 py-3">
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  if (userRoles.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-gray-400">
        <i className="fas fa-user-tag mb-3 text-4xl"></i>
        <p>No role assignments found</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-700/30">
      {userRoles.map((ur) => (
        <div key={ur.id} className="px-4 py-3 transition-colors hover:bg-gray-800/20">
          {isMobile ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Image
                  src={ur.volunteer?.profile_pic || '/icon-192x192.png'}
                  alt={
                    ur.volunteer
                      ? `${ur.volunteer.first_name} ${ur.volunteer.last_name}`
                      : 'Unknown'
                  }
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-200">
                    {ur.volunteer
                      ? `${ur.volunteer.first_name} ${ur.volunteer.last_name}`
                      : 'Unknown'}
                  </h4>
                  <p className="text-sm text-gray-400">{ur.volunteer?.email}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${getRoleColor(ur.role_definition?.role_name || '')}`}
                >
                  {ur.role_definition?.display_name || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Assigned: {formatDate(ur.assigned_at)}</span>
                <button
                  onClick={() => onRevoke(ur.id)}
                  className="p-1 text-red-400 hover:text-red-300"
                >
                  <i className="fas fa-times-circle"></i> Revoke
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-5 items-center gap-4">
              <div className="col-span-2 flex items-center space-x-3">
                <Image
                  src={ur.volunteer?.profile_pic || '/icon-192x192.png'}
                  alt={
                    ur.volunteer
                      ? `${ur.volunteer.first_name} ${ur.volunteer.last_name}`
                      : 'Unknown'
                  }
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full"
                />
                <div>
                  <div className="text-sm font-medium text-gray-200">
                    {ur.volunteer
                      ? `${ur.volunteer.first_name} ${ur.volunteer.last_name}`
                      : 'Unknown'}
                  </div>
                  <div className="text-xs text-gray-500">{ur.volunteer?.email}</div>
                </div>
              </div>
              <div>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${getRoleColor(ur.role_definition?.role_name || '')}`}
                >
                  {ur.role_definition?.display_name || 'Unknown'}
                </span>
              </div>
              <div className="text-sm text-gray-300">{formatDate(ur.assigned_at)}</div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onRevoke(ur.id)}
                  className="rounded p-1 text-gray-400 hover:text-red-400"
                  title="Revoke role"
                >
                  <i className="fas fa-times-circle"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
