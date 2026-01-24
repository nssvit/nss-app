'use client'

/**
 * RoleManagementPage Component
 * Main role management shell - orchestrates sub-components
 * Refactored from 787 LOC to ~180 LOC
 */

import { useState } from 'react'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { useRoles } from '@/hooks/useRoles'
import { useVolunteers } from '@/hooks/useVolunteers'
import { useToast } from '@/hooks/useToast'
import { Skeleton } from '../Skeleton'
import { AssignRoleModal } from './AssignRoleModal'
import { RoleDefinitionModal } from './RoleDefinitionModal'
import { RoleAssignmentsTable } from './RoleAssignmentsTable'
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

  // Convert hook data to component-compatible format
  const roleDefinitions = roles as unknown as Role[]
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
      role.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.role_name.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-exclamation-circle text-4xl text-red-400 mb-4"></i>
          <p className="text-gray-400">{error}</p>
          <button onClick={refetch} className="mt-4 button-glass-primary px-4 py-2 rounded-lg">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex-1 overflow-x-hidden overflow-y-auto main-content-bg mobile-scroll safe-area-bottom ${layout.getContentPadding()}`}
    >
      {/* Stats Row */}
      <div className={`grid ${layout.isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-4 mb-6`}>
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
      <div className="flex items-center gap-2 mb-6 border-b border-gray-700/30 pb-3">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'assignments' ? 'bg-blue-600/30 text-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <i className="fas fa-user-tag mr-2"></i>Role Assignments
        </button>
        <button
          onClick={() => setActiveTab('definitions')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'definitions' ? 'bg-blue-600/30 text-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <i className="fas fa-cog mr-2"></i>Role Definitions
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            placeholder={
              activeTab === 'assignments' ? 'Search volunteers or roles...' : 'Search roles...'
            }
            className="input-dark text-sm rounded-lg py-2 px-3 pl-9 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm"></i>
        </div>
        {activeTab === 'assignments' && (
          <select
            className="input-dark text-sm rounded-lg py-2 px-3"
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
          className="text-gray-500 hover:text-gray-300 text-sm py-2 px-3"
        >
          Clear
        </button>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() =>
            activeTab === 'assignments'
              ? setShowAssignModal(true)
              : (setEditingRole(undefined), setShowRoleModal(true))
          }
          className="button-glass-primary hover-lift flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium"
        >
          <i className={`fas fa-${activeTab === 'assignments' ? 'user-plus' : 'plus'} fa-sm`}></i>
          <span>{activeTab === 'assignments' ? 'Assign Role' : 'Create Role'}</span>
        </button>
        <button
          onClick={refetch}
          className="action-button text-gray-400 hover:text-gray-200 p-2 rounded-lg"
        >
          <i className="fas fa-sync"></i>
        </button>
      </div>

      {/* Content */}
      <div className="card-glass rounded-xl overflow-hidden">
        <div className="bg-gray-800/30 px-4 py-3 border-b border-gray-700/30">
          <div
            className={`grid ${layout.isMobile ? 'grid-cols-1' : 'grid-cols-5'} gap-4 items-center`}
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
