'use client'

import { useState, useEffect, useCallback } from 'react'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { useVolunteers } from '@/hooks/useVolunteers'
import { useRoles } from '@/hooks/useRoles'
import { useToast } from '@/hooks/useToast'
import { Skeleton } from './Skeleton'
import { Volunteer } from '@/types'
import Image from 'next/image'

interface ViewUserModalProps {
  isOpen: boolean
  onClose: () => void
  volunteer: Volunteer | null
  roles: string[]
}

function ViewUserModal({ isOpen, onClose, volunteer, roles }: ViewUserModalProps) {
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
            ×
          </button>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <Image
            src={(volunteer as any).avatar || volunteer.profilePic || '/icon-192x192.png'}
            alt={`${volunteer.firstName || ''} ${volunteer.lastName || ''}`}
            width={80}
            height={80}
            className="w-20 h-20 rounded-full"
          />
          <div>
            <h3 className="text-xl font-semibold text-gray-100">
              {volunteer.firstName || ''} {volunteer.lastName || ''}
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
            <p className="text-gray-200">{volunteer.rollNumber}</p>
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
            <p className="text-gray-200">{volunteer.phoneNo || 'Not set'}</p>
          </div>
          <div>
            <p className="text-gray-500">Gender</p>
            <p className="text-gray-200">{volunteer.gender || 'Not set'}</p>
          </div>
          <div>
            <p className="text-gray-500">NSS Join Year</p>
            <p className="text-gray-200">{volunteer.nssJoinYear || 'Not set'}</p>
          </div>
          <div>
            <p className="text-gray-500">Status</p>
            <p className={volunteer.isActive ? 'text-green-400' : 'text-red-400'}>
              {volunteer.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Joined</p>
            <p className="text-gray-200">
              {(volunteer as any).joinDate ||
                (volunteer.createdAt ? new Date(volunteer.createdAt).toLocaleDateString() : 'N/A')}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Events Participated</p>
            <p className="text-gray-200">{(volunteer as any).eventsParticipated || 0}</p>
          </div>
          <div>
            <p className="text-gray-500">Total Hours</p>
            <p className="text-gray-200">{(volunteer as any).totalHours || 0}</p>
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

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  volunteer: Volunteer | null
  onSave: (updates: Partial<Volunteer>) => Promise<void>
}

function EditUserModal({ isOpen, onClose, volunteer, onSave }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNo: '',
    address: '',
    isActive: true,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (volunteer) {
      setFormData({
        firstName: volunteer.firstName || '',
        lastName: volunteer.lastName || '',
        phoneNo: volunteer.phoneNo || '',
        address: volunteer.address || '',
        isActive: volunteer.isActive ?? true,
      })
    }
  }, [volunteer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSave(formData)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen || !volunteer) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 p-6 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-100">Edit User</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-2xl leading-none p-1"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
              <input
                type="text"
                required
                className="input-dark w-full text-sm rounded-lg px-4 py-3"
                value={formData.firstName}
                onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
              <input
                type="text"
                required
                className="input-dark w-full text-sm rounded-lg px-4 py-3"
                value={formData.lastName}
                onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
            <input
              type="tel"
              className="input-dark w-full text-sm rounded-lg px-4 py-3"
              value={formData.phoneNo}
              onChange={(e) => setFormData((prev) => ({ ...prev, phoneNo: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
            <textarea
              className="input-dark w-full text-sm rounded-lg px-4 py-3 resize-none"
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="isActive" className="text-sm text-gray-300">
              Active
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="button-glass-secondary hover-lift px-4 py-2 text-sm rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="button-glass-primary hover-lift px-4 py-2 text-sm rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function UserManagementPage() {
  const layout = useResponsiveLayout()
  const { success: showSuccess, error: showError, info: showInfo } = useToast()
  const { volunteers, loading, error, refetch, updateVolunteer, isAdmin } = useVolunteers()
  const { roles: roleDefinitions } = useRoles()

  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [viewingUser, setViewingUser] = useState<Volunteer | null>(null)
  const [editingUser, setEditingUser] = useState<Volunteer | null>(null)

  // Stub functions for features not yet implemented in the hook
  const adminPermanentDelete = async (_volunteerId: string) => {
    showInfo('Permanent deletion not yet implemented')
    return { error: 'Not implemented', data: null as any }
  }

  // Get roles for a volunteer (stub - returns empty array for now)
  const getRolesForVolunteer = (_volunteerId: string): string[] => {
    // TODO: Implement async role fetching
    return ['Volunteer']
  }

  // Get primary role (stub)
  const getPrimaryRole = (_volunteerId: string): string => {
    // TODO: Implement async role fetching
    return 'volunteer'
  }

  // Stats calculations
  const stats = {
    totalUsers: volunteers.length,
    activeUsers: volunteers.filter((v) => v.is_active).length,
    inactiveUsers: volunteers.filter((v) => !v.is_active).length,
    admins: volunteers.filter((v) => getPrimaryRole(v.id) === 'admin').length,
  }

  // Filter volunteers
  const filteredUsers = volunteers.filter((volunteer) => {
    const fullName = `${volunteer.firstName} ${volunteer.lastName}`
    const matchesSearch =
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volunteer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volunteer.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const primaryRole = getPrimaryRole(volunteer.id)
    const matchesRole = !roleFilter || primaryRole === roleFilter
    const matchesStatus =
      !statusFilter ||
      (statusFilter === 'active' && volunteer.isActive) ||
      (statusFilter === 'inactive' && !volunteer.isActive)

    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-red-400 bg-red-900/30'
      case 'program_officer':
        return 'text-blue-400 bg-blue-900/30'
      case 'event_lead':
      case 'documentation_lead':
        return 'text-purple-400 bg-purple-900/30'
      case 'volunteer':
      default:
        return 'text-green-400 bg-green-900/30'
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-400 bg-green-900/30' : 'text-red-400 bg-red-900/30'
  }

  const handleSelectUser = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((userId) => userId !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    setSelectedUsers(
      selectedUsers.length === filteredUsers.length ? [] : filteredUsers.map((u) => u.id)
    )
  }

  const clearFilters = () => {
    setSearchTerm('')
    setRoleFilter('')
    setStatusFilter('')
  }

  const handleView = (volunteer: Volunteer) => {
    setViewingUser(volunteer)
  }

  const handleEdit = (volunteer: Volunteer) => {
    setEditingUser(volunteer)
  }

  const handleSaveEdit = async (updates: Partial<Volunteer>) => {
    if (!editingUser) return
    const result = await updateVolunteer(editingUser.id, updates)
    if (result.error) {
      showError(result.error)
    } else {
      showSuccess('User updated successfully')
    }
  }

  const handleToggleActive = async (volunteer: Volunteer) => {
    const action = volunteer.isActive || volunteer.isActive ? 'deactivate' : 'reactivate'
    const firstName = volunteer.firstName || volunteer.firstName || ''
    const lastName = volunteer.lastName || volunteer.lastName || ''
    if (!confirm(`Are you sure you want to ${action} ${firstName} ${lastName}?`)) {
      return
    }

    const result = await updateVolunteer(volunteer.id, {
      isActive: !(volunteer.isActive || volunteer.isActive),
    })
    if (result.error) {
      showError(result.error)
    } else {
      showSuccess(`User ${action}d successfully`)
    }
  }

  const handleBulkDeactivate = async () => {
    if (selectedUsers.length === 0) return
    if (!confirm(`Are you sure you want to deactivate ${selectedUsers.length} users?`)) {
      return
    }

    let successCount = 0
    for (const userId of selectedUsers) {
      const result = await updateVolunteer(userId, { isActive: false })
      if (!result.error) successCount++
    }

    showSuccess(`${successCount} users deactivated`)
    setSelectedUsers([])
  }

  // Admin: Permanently delete a volunteer (DANGEROUS - deletes all data)
  const handlePermanentDelete = async (volunteer: Volunteer) => {
    if (!isAdmin) {
      showError('Only admins can permanently delete users')
      return
    }

    const firstName = volunteer.firstName || volunteer.firstName || ''
    const lastName = volunteer.lastName || volunteer.lastName || ''
    const confirmMessage = `⚠️ PERMANENT DELETION ⚠️\n\nYou are about to permanently delete ${firstName} ${lastName}.\n\nThis will:\n- Delete all event participations\n- Remove all role assignments\n- Delete the volunteer record\n- The auth account will need manual deletion\n\nThis action CANNOT be undone!\n\nType "DELETE" to confirm:`

    const userInput = prompt(confirmMessage)
    if (userInput !== 'DELETE') {
      showInfo('Deletion cancelled')
      return
    }

    const result = await adminPermanentDelete(volunteer.id)

    if (result.error) {
      showError(result.error)
    } else if (result.data) {
      showSuccess(
        `${result.data.volunteer_name} permanently deleted. Auth user ID: ${result.data.auth_user_id} (delete from Supabase dashboard)`
      )
    }
  }

  const statsDisplay = [
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), color: 'text-blue-400' },
    { label: 'Active Users', value: stats.activeUsers.toLocaleString(), color: 'text-green-400' },
    { label: 'Inactive', value: stats.inactiveUsers.toLocaleString(), color: 'text-yellow-400' },
    { label: 'Admins', value: stats.admins.toLocaleString(), color: 'text-red-400' },
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
        {loading ? (
          <>
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </>
        ) : (
          statsDisplay.map((stat, index) => (
            <div key={index} className="card-glass rounded-xl p-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Search and Filters */}
      <div
        className={`flex flex-wrap items-center gap-3 mb-6 ${layout.isMobile ? 'px-0' : 'px-1'}`}
      >
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
          <option value="event_lead">Event Lead</option>
          <option value="documentation_lead">Documentation Lead</option>
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
          className="text-gray-500 hover:text-gray-300 text-sm py-2 px-3"
          onClick={clearFilters}
        >
          Clear
        </button>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {selectedUsers.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">{selectedUsers.length} selected</span>
              <button
                onClick={handleBulkDeactivate}
                className="text-red-400 hover:text-red-300 px-3 py-2 rounded-lg text-sm"
              >
                <i className="fas fa-ban fa-sm mr-2"></i>
                Deactivate
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={refetch}
            className="action-button text-gray-400 hover:text-gray-200 p-2 rounded-lg"
          >
            <i className="fas fa-sync"></i>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="card-glass rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-800/30 px-4 py-3 border-b border-gray-700/30">
          <div
            className={`grid ${layout.isMobile ? 'grid-cols-1' : 'grid-cols-7'} gap-4 items-center`}
          >
            {!layout.isMobile && (
              <>
                <div className="flex items-center">
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
            )}
            {layout.isMobile && (
              <div className="text-sm font-medium text-gray-300">
                Users ({filteredUsers.length})
              </div>
            )}
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-700/30">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3">
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            ))
          ) : filteredUsers.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400">
              <i className="fas fa-users text-4xl mb-3"></i>
              <p>No users found</p>
            </div>
          ) : (
            filteredUsers.map((volunteer) => {
              const displayName = `${volunteer.firstName} ${volunteer.lastName}`
              const avatar = volunteer.avatar || '/icon-192x192.png'
              const primaryRole = getPrimaryRole(volunteer.id)

              return (
                <div
                  key={volunteer.id}
                  className="px-4 py-3 hover:bg-gray-800/20 transition-colors"
                >
                  {layout.isMobile ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          className="checkbox-custom"
                          checked={selectedUsers.includes(volunteer.id)}
                          onChange={() => handleSelectUser(volunteer.id)}
                        />
                        <Image
                          src={avatar}
                          alt={displayName}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-200">{displayName}</h4>
                          <p className="text-sm text-gray-400">{volunteer.email}</p>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getRoleColor(primaryRole)}`}
                          >
                            {primaryRole}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getStatusColor(volunteer.isActive ?? false)}`}
                          >
                            {volunteer.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{volunteer.totalHours || 0} hours</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(volunteer)}
                            className="text-gray-400 hover:text-blue-400 p-1"
                          >
                            <i className="fas fa-edit text-sm"></i>
                          </button>
                          <button
                            onClick={() => handleView(volunteer)}
                            className="text-gray-400 hover:text-green-400 p-1"
                          >
                            <i className="fas fa-eye text-sm"></i>
                          </button>
                          <button
                            onClick={() => handleToggleActive(volunteer)}
                            className="text-gray-400 hover:text-yellow-400 p-1"
                          >
                            <i
                              className={`fas fa-${volunteer.isActive ? 'ban' : 'check-circle'} text-sm`}
                            ></i>
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handlePermanentDelete(volunteer)}
                              className="text-gray-400 hover:text-red-600 p-1"
                              title="Permanently Delete"
                            >
                              <i className="fas fa-trash text-sm"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-7 gap-4 items-center">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="checkbox-custom"
                          checked={selectedUsers.includes(volunteer.id)}
                          onChange={() => handleSelectUser(volunteer.id)}
                        />
                      </div>
                      <div className="col-span-2 flex items-center space-x-3">
                        <Image
                          src={avatar}
                          alt={displayName}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <div className="font-medium text-gray-200 text-sm">{displayName}</div>
                          <div className="text-xs text-gray-500">{volunteer.email}</div>
                        </div>
                      </div>
                      <div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getRoleColor(primaryRole)}`}
                        >
                          {primaryRole}
                        </span>
                      </div>
                      <div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(volunteer.isActive ?? false)}`}
                        >
                          {volunteer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-300">{volunteer.totalHours || 0} hrs</div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(volunteer)}
                          className="text-gray-400 hover:text-blue-400 p-1 rounded"
                          title="Edit"
                        >
                          <i className="fas fa-edit text-sm"></i>
                        </button>
                        <button
                          onClick={() => handleView(volunteer)}
                          className="text-gray-400 hover:text-green-400 p-1 rounded"
                          title="View"
                        >
                          <i className="fas fa-eye text-sm"></i>
                        </button>
                        <button
                          onClick={() => handleToggleActive(volunteer)}
                          className="text-gray-400 hover:text-yellow-400 p-1 rounded"
                          title={volunteer.isActive ? 'Deactivate' : 'Reactivate'}
                        >
                          <i
                            className={`fas fa-${volunteer.isActive ? 'ban' : 'check-circle'} text-sm`}
                          ></i>
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handlePermanentDelete(volunteer)}
                            className="text-gray-400 hover:text-red-600 p-1 rounded"
                            title="Permanently Delete (Admin)"
                          >
                            <i className="fas fa-trash text-sm"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
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
