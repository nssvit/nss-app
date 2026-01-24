'use client'

import { useState } from 'react'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import {
  useHoursApproval,
  ParticipationForApproval,
  ApprovalFilter,
} from '@/hooks/useHoursApproval'
import { Skeleton } from './Skeleton'
import { useToast } from '@/hooks/useToast'
import Image from 'next/image'

interface ApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  participation: ParticipationForApproval | null
  mode: 'approve' | 'reject'
  onSubmit: (hours: number, notes: string) => Promise<void>
}

function ApprovalModal({ isOpen, onClose, participation, mode, onSubmit }: ApprovalModalProps) {
  const [hours, setHours] = useState(participation?.hours_attended || 0)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(hours, notes)
      setNotes('')
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen || !participation) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 p-6 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-100">
            {mode === 'approve' ? 'Approve Hours' : 'Reject Hours'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-2xl leading-none p-1"
          >
            ×
          </button>
        </div>

        <div className="mb-6 p-4 bg-gray-800/30 rounded-lg">
          <div className="flex items-center space-x-3 mb-3">
            <Image
              src={participation.volunteer?.profile_pic || '/icon-192x192.png'}
              alt={
                participation.volunteer
                  ? `${participation.volunteer.first_name} ${participation.volunteer.last_name}`
                  : 'Unknown'
              }
              width={40}
              height={40}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h4 className="font-medium text-gray-200">
                {participation.volunteer
                  ? `${participation.volunteer.first_name} ${participation.volunteer.last_name}`
                  : 'Unknown'}
              </h4>
              <p className="text-sm text-gray-400">{participation.volunteer?.roll_number}</p>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            <p>
              <strong>Event:</strong> {participation.event?.event_name || 'Unknown'}
            </p>
            <p>
              <strong>Date:</strong>{' '}
              {participation.event?.start_date
                ? new Date(participation.event.start_date).toLocaleDateString()
                : 'N/A'}
            </p>
            <p>
              <strong>Requested Hours:</strong> {participation.hours_attended}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'approve' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Approved Hours</label>
              <input
                type="number"
                min={0}
                max={24}
                className="input-dark w-full text-sm rounded-lg px-4 py-3"
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-gray-500 mt-1">You can adjust the hours if needed</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {mode === 'approve' ? 'Notes (Optional)' : 'Reason for Rejection'}
            </label>
            <textarea
              className="input-dark w-full text-sm rounded-lg px-4 py-3 resize-none"
              rows={3}
              placeholder={
                mode === 'approve' ? 'Add any notes...' : 'Please provide a reason for rejection...'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required={mode === 'reject'}
            />
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
              className={`hover-lift px-4 py-2 text-sm rounded-lg disabled:opacity-50 ${
                mode === 'approve'
                  ? 'button-glass-primary'
                  : 'bg-red-600/30 text-red-400 hover:bg-red-600/40'
              }`}
            >
              {submitting ? 'Processing...' : mode === 'approve' ? 'Approve Hours' : 'Reject Hours'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function HoursApprovalPage() {
  const layout = useResponsiveLayout()
  const { success: showSuccess, error: showError } = useToast()
  const {
    participations,
    loading,
    error,
    filter,
    pendingCount,
    setFilter,
    refetch,
    approveHours,
    rejectHours,
    bulkApproveHours,
    getStats,
  } = useHoursApproval()

  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [modalMode, setModalMode] = useState<'approve' | 'reject'>('approve')
  const [selectedParticipation, setSelectedParticipation] =
    useState<ParticipationForApproval | null>(null)
  const [showModal, setShowModal] = useState(false)

  const stats = getStats()

  // Filter participations by search
  const filteredParticipations = participations.filter((p) => {
    const volunteerName = p.volunteer ? `${p.volunteer.first_name} ${p.volunteer.last_name}` : ''
    const eventName = p.event?.event_name || ''
    const searchLower = searchTerm.toLowerCase()

    return (
      volunteerName.toLowerCase().includes(searchLower) ||
      eventName.toLowerCase().includes(searchLower) ||
      p.volunteer?.roll_number?.toLowerCase().includes(searchLower) ||
      p.volunteer?.email?.toLowerCase().includes(searchLower)
    )
  })

  const handleSelectItem = (id: string) => {
    setSelectedItems((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const handleSelectAll = () => {
    const pendingItems = filteredParticipations
      .filter((p) => (p.approval_status || p.approvalStatus || 'pending') === 'pending')
      .map((p) => p.id)

    setSelectedItems(selectedItems.length === pendingItems.length ? [] : pendingItems)
  }

  const handleApprove = (participation: ParticipationForApproval) => {
    setSelectedParticipation(participation)
    setModalMode('approve')
    setShowModal(true)
  }

  const handleReject = (participation: ParticipationForApproval) => {
    setSelectedParticipation(participation)
    setModalMode('reject')
    setShowModal(true)
  }

  const handleModalSubmit = async (hours: number, notes: string) => {
    if (!selectedParticipation) return

    if (modalMode === 'approve') {
      const result = await approveHours(selectedParticipation.id, hours, notes || undefined)
      if (result.error) {
        showError(result.error)
      } else {
        showSuccess('Hours approved successfully')
      }
    } else {
      const result = await rejectHours(selectedParticipation.id, notes)
      if (result.error) {
        showError(result.error)
      } else {
        showSuccess('Hours rejected')
      }
    }
  }

  const handleBulkApprove = async () => {
    if (selectedItems.length === 0) return

    if (!confirm(`Are you sure you want to approve ${selectedItems.length} hour records?`)) {
      return
    }

    const result = await bulkApproveHours(selectedItems)
    if (result.error) {
      showError(result.error)
    } else {
      showSuccess(`${result.count} records approved`)
      setSelectedItems([])
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400 bg-yellow-900/30'
      case 'approved':
        return 'text-green-400 bg-green-900/30'
      case 'rejected':
        return 'text-red-400 bg-red-900/30'
      default:
        return 'text-gray-400 bg-gray-900/30'
    }
  }

  const statsDisplay = [
    {
      label: 'Pending',
      value: pendingCount.toString(),
      color: 'text-yellow-400',
      filter: 'pending' as ApprovalFilter,
    },
    {
      label: 'Approved',
      value: stats.approved.toString(),
      color: 'text-green-400',
      filter: 'approved' as ApprovalFilter,
    },
    {
      label: 'Rejected',
      value: stats.rejected.toString(),
      color: 'text-red-400',
      filter: 'rejected' as ApprovalFilter,
    },
    {
      label: 'Total Hours Pending',
      value: stats.totalHoursPending.toString(),
      color: 'text-purple-400',
      filter: 'all' as ApprovalFilter,
    },
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
            <button
              key={index}
              onClick={() => setFilter(stat.filter)}
              className={`card-glass rounded-xl p-4 text-left transition-all ${
                filter === stat.filter ? 'ring-2 ring-blue-500/50' : ''
              }`}
            >
              <div className="text-center">
                <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-700/30 pb-3">
        {(['pending', 'approved', 'rejected', 'all'] as ApprovalFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
              filter === f ? 'bg-blue-600/30 text-blue-400' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {f === 'all' ? 'All Records' : f}
            {f === 'pending' && pendingCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-600/30 text-yellow-400 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search and Actions */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            placeholder="Search by volunteer or event..."
            className="input-dark text-sm rounded-lg py-2 px-3 pl-9 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm"></i>
        </div>

        {filter === 'pending' && selectedItems.length > 0 && (
          <button
            onClick={handleBulkApprove}
            className="button-glass-primary hover-lift px-4 py-2 rounded-lg text-sm font-medium"
          >
            <i className="fas fa-check-double mr-2"></i>
            Approve Selected ({selectedItems.length})
          </button>
        )}

        <button
          onClick={refetch}
          className="action-button text-gray-400 hover:text-gray-200 p-2 rounded-lg"
        >
          <i className="fas fa-sync"></i>
        </button>
      </div>

      {/* Table */}
      <div className="card-glass rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-800/30 px-4 py-3 border-b border-gray-700/30">
          <div
            className={`grid ${layout.isMobile ? 'grid-cols-1' : 'grid-cols-7'} gap-4 items-center`}
          >
            {!layout.isMobile && (
              <>
                {filter === 'pending' && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="checkbox-custom"
                      checked={
                        selectedItems.length > 0 &&
                        selectedItems.length ===
                          filteredParticipations.filter(
                            (p) =>
                              (p.approval_status || p.approvalStatus || 'pending') === 'pending'
                          ).length
                      }
                      onChange={handleSelectAll}
                    />
                  </div>
                )}
                <div
                  className={`${
                    filter === 'pending' ? 'col-span-2' : 'col-span-3'
                  } text-sm font-medium text-gray-300`}
                >
                  Volunteer
                </div>
                <div className="col-span-2 text-sm font-medium text-gray-300">Event</div>
                <div className="text-sm font-medium text-gray-300">Hours</div>
                <div className="text-sm font-medium text-gray-300">Actions</div>
              </>
            )}
            {layout.isMobile && (
              <div className="text-sm font-medium text-gray-300">
                Hour Approvals ({filteredParticipations.length})
              </div>
            )}
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-700/30">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3">
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ))
          ) : filteredParticipations.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400">
              <i className="fas fa-clock text-4xl mb-3"></i>
              <p>No records found</p>
            </div>
          ) : (
            filteredParticipations.map((p) => (
              <div key={p.id} className="px-4 py-3 hover:bg-gray-800/20 transition-colors">
                {layout.isMobile ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      {filter === 'pending' && (
                        <input
                          type="checkbox"
                          className="checkbox-custom"
                          checked={selectedItems.includes(p.id)}
                          onChange={() => handleSelectItem(p.id)}
                        />
                      )}
                      <Image
                        src={p.volunteer?.profile_pic || '/icon-192x192.png'}
                        alt={
                          p.volunteer
                            ? `${p.volunteer.first_name} ${p.volunteer.last_name}`
                            : 'Unknown'
                        }
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-200">
                          {p.volunteer
                            ? `${p.volunteer.first_name} ${p.volunteer.last_name}`
                            : 'Unknown'}
                        </h4>
                        <p className="text-sm text-gray-400">
                          {p.event?.event_name || 'Unknown Event'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-400">
                          {(p.approval_status || p.approvalStatus || 'pending') === 'approved'
                            ? p.approved_hours
                            : p.hours_attended}
                          h
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                            p.approval_status || p.approvalStatus || 'pending'
                          )}`}
                        >
                          {p.approval_status || p.approvalStatus || 'pending'}
                        </span>
                      </div>
                    </div>
                    {(p.approval_status || p.approvalStatus || 'pending') === 'pending' && (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleApprove(p)}
                          className="text-green-400 hover:text-green-300 px-3 py-1 text-sm rounded bg-green-900/20"
                        >
                          <i className="fas fa-check mr-1"></i> Approve
                        </button>
                        <button
                          onClick={() => handleReject(p)}
                          className="text-red-400 hover:text-red-300 px-3 py-1 text-sm rounded bg-red-900/20"
                        >
                          <i className="fas fa-times mr-1"></i> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-4 items-center">
                    {filter === 'pending' && (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="checkbox-custom"
                          checked={selectedItems.includes(p.id)}
                          onChange={() => handleSelectItem(p.id)}
                        />
                      </div>
                    )}
                    <div
                      className={`${
                        filter === 'pending' ? 'col-span-2' : 'col-span-3'
                      } flex items-center space-x-3`}
                    >
                      <Image
                        src={p.volunteer?.profile_pic || '/icon-192x192.png'}
                        alt={
                          p.volunteer
                            ? `${p.volunteer.first_name} ${p.volunteer.last_name}`
                            : 'Unknown'
                        }
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <div className="font-medium text-gray-200 text-sm">
                          {p.volunteer
                            ? `${p.volunteer.first_name} ${p.volunteer.last_name}`
                            : 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500">{p.volunteer?.roll_number}</div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-sm text-gray-200">
                        {p.event?.event_name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(p.event?.start_date || null)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-400">
                        {(p.approval_status || p.approvalStatus || 'pending') === 'approved'
                          ? p.approved_hours
                          : p.hours_attended}{' '}
                        hrs
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(
                          p.approval_status || p.approvalStatus || 'pending'
                        )}`}
                      >
                        {p.approval_status || p.approvalStatus || 'pending'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      {(p.approval_status || p.approvalStatus || 'pending') === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleApprove(p)}
                            className="text-gray-400 hover:text-green-400 p-1 rounded"
                            title="Approve"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button
                            onClick={() => handleReject(p)}
                            className="text-gray-400 hover:text-red-400 p-1 rounded"
                            title="Reject"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-500">
                          {p.approved_by_volunteer
                            ? `by ${p.approved_by_volunteer.first_name}`
                            : ''}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Approval Modal */}
      <ApprovalModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedParticipation(null)
        }}
        participation={selectedParticipation}
        mode={modalMode}
        onSubmit={handleModalSubmit}
      />
    </div>
  )
}
