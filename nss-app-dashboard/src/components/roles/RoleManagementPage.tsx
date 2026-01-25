'use client'

/**
 * RoleManagementPage Component
 * Main role management shell - orchestrates sub-components
 * Refactored from 787 LOC to ~180 LOC
 */

import { useState } from 'react'
import { Skeleton } from '@/components/ui'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { useRoles } from '@/hooks/useRoles'
import { useToast } from '@/hooks/useToast'
import { useVolunteers } from '@/hooks/useVolunteers'
import { AssignRoleModal } from './AssignRoleModal'
import { RoleAssignmentsTable } from './RoleAssignmentsTable'
import { RoleDefinitionModal } from './RoleDefinitionModal'
import { RoleDefinitionsTable } from './RoleDefinitionsTable'
import type { Role, RoleTab, UserRoleWithDetails } from './types'

export function RoleManagementPage() {
  const layout = useResponsiveLayout()
  const { success: showSuccess, error: showError, info: showInfo } = useToast()
  const { roles, loading, error, refetch, assignRole, revokeRole } = useRoles()
  const { volunteers } = useVolunteers()

  const [activeTab, setActiveTab] = useState<RoleTab>('assignments')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | undefined>()

  // Convert hook data (camelCase) to component-compatible format (snake_case)
  const roleDefinitions: Role[] = roles.map((r) => ({
    id: r.id,
    role_name: r.roleName,
    display_name: r.displayName,
    description: r.description,
    permissions: (r.permissions as Record<string, unknown>) || {},
    hierarchy_level: r.hierarchyLevel ?? 0,
    is_active: r.isActive ?? true,
    created_at: r.createdAt?.toISOString(),
    updated_at: r.updatedAt?.toISOString(),
  }))
  const userRoles: UserRoleWithDetails[] = [] // TODO: Get from useRoles when available

  const stats = {
    totalRoles: roleDefinitions.length,
    activeRoles: roleDefinitions.filter((r) => r.is_active).length,
    totalAssignments: userRoles.filter((ur) => ur.is_active).length,
    admins: userRoles.filter((ur) => ur.role_definition?.role_name === 'admin' && ur.is_active)
      .length,
  }

  const filteredUserRoles = userRoles.filter((ur) => {
    if (!ur.is_active) return false
    const name = ur.volunteer ? `${ur.volunteer.first_name} ${ur.volunteer.last_name}` : ''
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ur.volunteer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ur.role_definition?.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = !roleFilter || ur.role_definition_id === roleFilter
    return matchesSearch && matchesRole
  })

  const filteredRoles = roleDefinitions.filter(
    (role) =>
      (role.display_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.role_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAssignRole = async (
    volunteerId: string,
    roleId: string,
    expiresAt: string | null
  ) => {
    const result = await assignRole(volunteerId, roleId)
    if (result.error) showError(result.error)
    else showSuccess('Role assigned successfully')
  }

  const handleRevokeRole = async (userRoleId: string) => {
    if (!confirm('Are you sure you want to revoke this role?')) return
    const result = await revokeRole(userRoleId.split('-')[0], userRoleId.split('-')[1])
    if (result.error) showError(result.error)
    else showSuccess('Role revoked successfully')
  }

  const handleDeactivateRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to deactivate this role?')) return
    showInfo('Role deactivation not implemented yet')
  }

  const handleCreateOrUpdateRole = async (data: Partial<Role>) => {
    showSuccess(editingRole ? 'Role updated' : 'Role created')
  }

  const statsDisplay = [
    { label: 'Total Roles', value: stats.totalRoles, color: 'text-blue-400' },
    { label: 'Active Roles', value: stats.activeRoles, color: 'text-green-400' },
    { label: 'Assignments', value: stats.totalAssignments, color: 'text-purple-400' },
    { label: 'Admins', value: stats.admins, color: 'text-red-400' },
  ]

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <i className="fas fa-exclamation-circle mb-4 text-4xl text-red-400"></i>
          <p className="text-gray-400">{error}</p>
          <button onClick={refetch} className="button-glass-primary mt-4 rounded-lg px-4 py-2">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`main-content-bg mobile-scroll safe-area-bottom flex-1 overflow-x-hidden overflow-y-auto ${layout.getContentPadding()}`}
    >
      {/* Stats Row */}
      <div className={`grid ${layout.isMobile ? 'grid-cols-2' : 'grid-cols-4'} mb-6 gap-4`}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          : statsDisplay.map((stat, i) => (
              <div key={i} className="card-glass rounded-xl p-4 text-center">
                <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-2 border-b border-gray-700/30 pb-3">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'assignments' ? 'bg-blue-600/30 text-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <i className="fas fa-user-tag mr-2"></i>Role Assignments
        </button>
        <button
          onClick={() => setActiveTab('definitions')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'definitions' ? 'bg-blue-600/30 text-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <i className="fas fa-cog mr-2"></i>Role Definitions
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <input
            type="text"
            placeholder={
              activeTab === 'assignments' ? 'Search volunteers or roles...' : 'Search roles...'
            }
            className="input-dark w-full rounded-lg px-3 py-2 pl-9 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="fas fa-search absolute top-1/2 left-3 -translate-y-1/2 transform text-sm text-gray-500"></i>
        </div>
        {activeTab === 'assignments' && (
          <select
            className="input-dark rounded-lg px-3 py-2 text-sm"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            {roleDefinitions
              .filter((r) => r.is_active)
              .map((role) => (
                <option key={role.id} value={role.id}>
                  {role.display_name}
                </option>
              ))}
          </select>
        )}
        <button
          onClick={() => {
            setSearchTerm('')
            setRoleFilter('')
          }}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-300"
        >
          Clear
        </button>
      </div>

      {/* Action Bar */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() =>
            activeTab === 'assignments'
              ? setShowAssignModal(true)
              : (setEditingRole(undefined), setShowRoleModal(true))
          }
          className="button-glass-primary hover-lift flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium"
        >
          <i className={`fas fa-${activeTab === 'assignments' ? 'user-plus' : 'plus'} fa-sm`}></i>
          <span>{activeTab === 'assignments' ? 'Assign Role' : 'Create Role'}</span>
        </button>
        <button
          onClick={refetch}
          className="action-button rounded-lg p-2 text-gray-400 hover:text-gray-200"
        >
          <i className="fas fa-sync"></i>
        </button>
      </div>

      {/* Content */}
      <div className="card-glass overflow-hidden rounded-xl">
        <div className="border-b border-gray-700/30 bg-gray-800/30 px-4 py-3">
          <div
            className={`grid ${layout.isMobile ? 'grid-cols-1' : 'grid-cols-5'} items-center gap-4`}
          >
            {activeTab === 'assignments' ? (
              !layout.isMobile ? (
                <>
                  <div className="col-span-2 text-sm font-medium text-gray-300">Volunteer</div>
                  <div className="text-sm font-medium text-gray-300">Role</div>
                  <div className="text-sm font-medium text-gray-300">Assigned</div>
                  <div className="text-sm font-medium text-gray-300">Actions</div>
                </>
              ) : (
                <div className="text-sm font-medium text-gray-300">
                  Role Assignments ({filteredUserRoles.length})
                </div>
              )
            ) : !layout.isMobile ? (
              <>
                <div className="text-sm font-medium text-gray-300">Role Name</div>
                <div className="col-span-2 text-sm font-medium text-gray-300">Description</div>
                <div className="text-sm font-medium text-gray-300">Status</div>
                <div className="text-sm font-medium text-gray-300">Actions</div>
              </>
            ) : (
              <div className="text-sm font-medium text-gray-300">
                Role Definitions ({filteredRoles.length})
              </div>
            )}
          </div>
        </div>

        {activeTab === 'assignments' ? (
          <RoleAssignmentsTable
            userRoles={filteredUserRoles}
            loading={loading}
            isMobile={layout.isMobile}
            onRevoke={handleRevokeRole}
          />
        ) : (
          <RoleDefinitionsTable
            roles={filteredRoles}
            loading={loading}
            isMobile={layout.isMobile}
            onEdit={(role) => {
              setEditingRole(role)
              setShowRoleModal(true)
            }}
            onDeactivate={handleDeactivateRole}
          />
        )}
      </div>

      {/* Modals */}
      <AssignRoleModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        roleDefinitions={roleDefinitions}
        volunteers={volunteers.map((v) => ({
          id: v.id,
          first_name: v.firstName || '',
          last_name: v.lastName || '',
          email: v.email,
          profile_pic: v.profilePic || null,
        }))}
        existingRoles={userRoles}
        onAssign={handleAssignRole}
      />
      <RoleDefinitionModal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false)
          setEditingRole(undefined)
        }}
        onSubmit={handleCreateOrUpdateRole}
        initialData={editingRole}
        mode={editingRole ? 'edit' : 'create'}
      />
    </div>
  )
}
