'use client'

/**
 * UserManagementPage Component
 * Main user management shell - orchestrates sub-components
 * Refactored from 699 LOC to ~160 LOC
 */

import { useState, useEffect } from 'react'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { useVolunteers } from '@/hooks/useVolunteers'
import { useRoles } from '@/hooks/useRoles'
import { useToast } from '@/hooks/useToast'
import { Skeleton } from '@/components/ui'
import { ViewUserModal } from './ViewUserModal'
import { EditUserModal } from './EditUserModal'
import { UsersTable } from './UsersTable'
import type { Volunteer, UserStats } from './types'

export function UserManagementPage() {
  const layout = useResponsiveLayout()
  const { success: showSuccess, error: showError, info: showInfo } = useToast()
  const { volunteers, loading, error, refetch, updateVolunteer, isAdmin } = useVolunteers()
  const { volunteerRolesCache, loadVolunteerRoles } = useRoles()

  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [viewingUser, setViewingUser] = useState<Volunteer | null>(null)
  const [editingUser, setEditingUser] = useState<Volunteer | null>(null)

  // Load roles for all volunteers when they change
  useEffect(() => {
    if (volunteers.length > 0 && loadVolunteerRoles) {
      const ids = volunteers.map((v: any) => v.id)
      loadVolunteerRoles(ids)
    }
  }, [volunteers, loadVolunteerRoles])

  // Transform volunteers to local type
  const users: Volunteer[] = volunteers.map((v: any) => ({
    id: v.id,
    first_name: v.firstName || '',
    last_name: v.lastName || '',
    email: v.email,
    roll_number: v.rollNumber || '',
    branch: v.branch || '',
    year: v.year || 0,
    phone_no: v.phoneNo,
    address: v.address,
    gender: v.gender,
    nss_join_year: v.nssJoinYear,
    is_active: v.isActive ?? true,
    avatar: v.avatar || v.profilePic,
    eventsParticipated: v.eventsParticipated,
    totalHours: v.totalHours,
    joinDate: v.joinDate,
  }))

  // Sync function for getting roles from cache
  const getCachedRoles = (id: string): { roleName?: string }[] => {
    return volunteerRolesCache?.[id] || []
  }

  const getPrimaryRole = (id: string) => {
    const roles = getCachedRoles(id)
    return roles.length > 0 ? roles[0]?.roleName || 'volunteer' : 'volunteer'
  }

  const getRolesForVolunteer = (id: string) =>
    getCachedRoles(id).map((r) => r.roleName || 'Unknown')

  const stats: UserStats = {
    totalUsers: users.length,
    activeUsers: users.filter((v) => v.is_active).length,
    inactiveUsers: users.filter((v) => !v.is_active).length,
    admins: users.filter((v) => getPrimaryRole(v.id) === 'admin').length,
  }

  const filteredUsers = users.filter((v) => {
    const name = `${v.first_name} ${v.last_name}`
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.roll_number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = !roleFilter || getPrimaryRole(v.id) === roleFilter
    const matchesStatus =
      !statusFilter ||
      (statusFilter === 'active' && v.is_active) ||
      (statusFilter === 'inactive' && !v.is_active)
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleSelectUser = (id: string) =>
    setSelectedUsers((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  const handleSelectAll = () =>
    setSelectedUsers(
      selectedUsers.length === filteredUsers.length ? [] : filteredUsers.map((u) => u.id)
    )

  const handleSaveEdit = async (updates: Partial<Volunteer>) => {
    if (!editingUser) return
    // Transform to Drizzle format (camelCase)
    const drizzleUpdates: Record<string, any> = {
      firstName: updates.first_name,
      lastName: updates.last_name,
      phoneNo: updates.phone_no,
      address: updates.address,
      isActive: updates.is_active,
    }
    const result = await updateVolunteer(editingUser.id, drizzleUpdates)
    if (result.error) showError(result.error)
    else showSuccess('User updated')
  }

  const handleToggleActive = async (user: Volunteer) => {
    if (
      !confirm(
        `Are you sure you want to ${user.is_active ? 'deactivate' : 'reactivate'} ${user.first_name}?`
      )
    )
      return
    const result = await updateVolunteer(user.id, { isActive: !user.is_active })
    if (result.error) showError(result.error)
    else showSuccess(`User ${user.is_active ? 'deactivated' : 'reactivated'}`)
  }

  const handleDelete = async (user: Volunteer) => {
    if (!isAdmin) {
      showError('Only admins can delete users')
      return
    }
    if (prompt(`Type "DELETE" to permanently delete ${user.first_name}`) !== 'DELETE') return
    showInfo('Deletion not implemented in this version')
  }

  const handleBulkDeactivate = async () => {
    if (selectedUsers.length === 0 || !confirm(`Deactivate ${selectedUsers.length} users?`)) return
    let count = 0
    for (const id of selectedUsers) {
      const result = await updateVolunteer(id, { isActive: false })
      if (!result.error) count++
    }
    showSuccess(`${count} users deactivated`)
    setSelectedUsers([])
  }

  const statsDisplay = [
    { label: 'Total Users', value: stats.totalUsers, color: 'text-blue-400' },
    { label: 'Active Users', value: stats.activeUsers, color: 'text-green-400' },
    { label: 'Inactive', value: stats.inactiveUsers, color: 'text-yellow-400' },
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
      {/* Stats */}
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            placeholder="Search users..."
            className="input-dark text-sm rounded-lg py-2 px-3 pl-9 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm"></i>
        </div>
        <select
          className="input-dark text-sm rounded-lg py-2 px-3"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="program_officer">Program Officer</option>
          <option value="volunteer">Volunteer</option>
        </select>
        <select
          className="input-dark text-sm rounded-lg py-2 px-3"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          onClick={() => {
            setSearchTerm('')
            setRoleFilter('')
            setStatusFilter('')
          }}
          className="text-gray-500 hover:text-gray-300 text-sm"
        >
          Clear
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mb-4">
        {selectedUsers.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">{selectedUsers.length} selected</span>
            <button
              onClick={handleBulkDeactivate}
              className="text-red-400 hover:text-red-300 px-3 py-2 rounded-lg text-sm"
            >
              <i className="fas fa-ban fa-sm mr-2"></i>Deactivate
            </button>
          </div>
        )}
        <button
          onClick={refetch}
          className="action-button text-gray-400 hover:text-gray-200 p-2 rounded-lg ml-auto"
        >
          <i className="fas fa-sync"></i>
        </button>
      </div>

      {/* Table */}
      <div className="card-glass rounded-xl overflow-hidden">
        <div className="bg-gray-800/30 px-4 py-3 border-b border-gray-700/30">
          <div
            className={`grid ${layout.isMobile ? 'grid-cols-1' : 'grid-cols-7'} gap-4 items-center`}
          >
            {!layout.isMobile ? (
              <>
                <div>
                  <input
                    type="checkbox"
                    className="checkbox-custom"
                    checked={
                      selectedUsers.length === filteredUsers.length && filteredUsers.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                </div>
                <div className="col-span-2 text-sm font-medium text-gray-300">User</div>
                <div className="text-sm font-medium text-gray-300">Role</div>
                <div className="text-sm font-medium text-gray-300">Status</div>
                <div className="text-sm font-medium text-gray-300">Hours</div>
                <div className="text-sm font-medium text-gray-300">Actions</div>
              </>
            ) : (
              <div className="text-sm font-medium text-gray-300">
                Users ({filteredUsers.length})
              </div>
            )}
          </div>
        </div>
        <UsersTable
          users={filteredUsers}
          selectedUsers={selectedUsers}
          loading={loading}
          isMobile={layout.isMobile}
          isAdmin={isAdmin}
          getPrimaryRole={getPrimaryRole}
          onSelectUser={handleSelectUser}
          onSelectAll={handleSelectAll}
          onView={setViewingUser}
          onEdit={setEditingUser}
          onToggleActive={handleToggleActive}
          onDelete={handleDelete}
        />
      </div>

      {/* Modals */}
      <ViewUserModal
        isOpen={!!viewingUser}
        onClose={() => setViewingUser(null)}
        volunteer={viewingUser}
        roles={viewingUser ? getRolesForVolunteer(viewingUser.id) : []}
      />
      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        volunteer={editingUser}
        onSave={handleSaveEdit}
      />
    </div>
  )
}
