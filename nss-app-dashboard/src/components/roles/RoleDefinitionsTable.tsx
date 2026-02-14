'use client'

/**
 * RoleDefinitionsTable Component
 * Table displaying role definitions
 */

import { Skeleton } from '@/components/ui'
import type { Role } from './types'

interface RoleDefinitionsTableProps {
  roles: Role[]
  loading: boolean
  isMobile: boolean
  onEdit: (role: Role) => void
  onDeactivate: (roleId: string) => void
}

export function RoleDefinitionsTable({
  roles,
  loading,
  isMobile,
  onEdit,
  onDeactivate,
}: RoleDefinitionsTableProps) {
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

  if (roles.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-gray-400">
        <i className="fas fa-cog mb-3 text-4xl"></i>
        <p>No roles found</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-700/30">
      {roles.map((role) => (
        <div key={role.id} className="px-4 py-3 transition-colors hover:bg-gray-800/20">
          {isMobile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-200">{role.display_name}</h4>
                  <p className="text-xs text-gray-500">{role.role_name}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${role.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}
                >
                  {role.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-400">{role.description || 'No description'}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Level: {role.hierarchy_level}</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEdit(role)}
                    className="p-1 text-blue-400 hover:text-blue-300"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  {role.is_active && (
                    <button
                      onClick={() => onDeactivate(role.id)}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      <i className="fas fa-ban"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-5 items-center gap-4">
              <div>
                <div className="text-sm font-medium text-gray-200">{role.display_name}</div>
                <div className="text-xs text-gray-500">{role.role_name}</div>
              </div>
              <div className="col-span-2 truncate text-sm text-gray-400">
                {role.description || 'No description'}
              </div>
              <div>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${role.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}
                >
                  {role.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(role)}
                  className="rounded p-1 text-gray-400 hover:text-blue-400"
                  title="Edit role"
                >
                  <i className="fas fa-edit"></i>
                </button>
                {role.is_active && (
                  <button
                    onClick={() => onDeactivate(role.id)}
                    className="rounded p-1 text-gray-400 hover:text-red-400"
                    title="Deactivate role"
                  >
                    <i className="fas fa-ban"></i>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
