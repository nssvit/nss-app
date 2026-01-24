'use client'

/**
 * HoursApprovalPage Component
 * Main hours approval shell - orchestrates sub-components
 * Refactored from 646 LOC to ~150 LOC
 */

import { useState } from 'react'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { useHoursApproval } from '@/hooks/useHoursApproval'
import { useToast } from '@/hooks/useToast'
import { Skeleton } from '../Skeleton'
import { ApprovalModal } from './ApprovalModal'
import { HoursTable } from './HoursTable'
import type { ApprovalFilter } from './types'

export function HoursApprovalPage() {
  const layout = useResponsiveLayout()
  const { success: showSuccess, error: showError } = useToast()
  const { participations, loading, error, filter, pendingCount, setFilter, refetch, approveHours, rejectHours, bulkApproveHours, getStats } = useHoursApproval()

  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [modalMode, setModalMode] = useState<'approve' | 'reject'>('approve')
  const [selectedParticipation, setSelectedParticipation] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)

  const stats = getStats()

  // Transform participations to component format
  const items = participations.map((p: any) => ({
    id: p.id, hoursAttended: p.hoursAttended || 0, approvedHours: p.approvedHours, approvalStatus: p.approvalStatus || 'pending',
    volunteer: p.volunteer ? { firstName: p.volunteer.firstName || '', lastName: p.volunteer.lastName || '', rollNumber: p.volunteer.rollNumber || '', email: p.volunteer.email || '', profilePic: p.volunteer.profilePic } : undefined,
    event: p.event ? { eventName: p.event.eventName || 'Unknown', startDate: p.event.startDate || '' } : undefined,
  }))

  const filteredItems = items.filter((p) => {
    const name = p.volunteer ? `${p.volunteer.firstName} ${p.volunteer.lastName}` : ''
    const event = p.event?.eventName || ''
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || event.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const handleSelectItem = (id: string) => setSelectedItems((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  const handleSelectAll = () => {
    const pending = filteredItems.filter((p) => p.approvalStatus === 'pending').map((p) => p.id)
    setSelectedItems(selectedItems.length === pending.length ? [] : pending)
  }

  const handleApprove = (p: any) => { setSelectedParticipation(p); setModalMode('approve'); setShowModal(true) }
  const handleReject = (p: any) => { setSelectedParticipation(p); setModalMode('reject'); setShowModal(true) }

  const handleModalSubmit = async (hours: number, notes: string) => {
    if (!selectedParticipation) return
    const result = modalMode === 'approve'
      ? await approveHours(selectedParticipation.id, hours, notes || undefined)
      : await rejectHours(selectedParticipation.id, notes)
    if (result.error) showError(result.error)
    else showSuccess(modalMode === 'approve' ? 'Hours approved' : 'Hours rejected')
  }

  const handleBulkApprove = async () => {
    if (selectedItems.length === 0 || !confirm(`Approve ${selectedItems.length} records?`)) return
    const result = await bulkApproveHours(selectedItems)
    if (result.error) showToast(result.error, 'error')
    else { showToast(`${result.count} records approved`, 'success'); setSelectedItems([]) }
  }

  const statsDisplay = [
    { label: 'Pending', value: pendingCount, color: 'text-yellow-400', f: 'pending' as ApprovalFilter },
    { label: 'Approved', value: stats.approved, color: 'text-green-400', f: 'approved' as ApprovalFilter },
    { label: 'Rejected', value: stats.rejected, color: 'text-red-400', f: 'rejected' as ApprovalFilter },
    { label: 'Hours Pending', value: stats.totalHoursPending, color: 'text-purple-400', f: 'all' as ApprovalFilter },
  ]

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-exclamation-circle text-4xl text-red-400 mb-4"></i>
          <p className="text-gray-400">{error}</p>
          <button onClick={refetch} className="mt-4 button-glass-primary px-4 py-2 rounded-lg">Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex-1 overflow-x-hidden overflow-y-auto main-content-bg mobile-scroll safe-area-bottom ${layout.getContentPadding()}`}>
      {/* Stats */}
      <div className={`grid ${layout.isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-4 mb-6`}>
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />) :
          statsDisplay.map((stat, i) => (
            <button key={i} onClick={() => setFilter(stat.f)}
              className={`card-glass rounded-xl p-4 text-center transition-all ${filter === stat.f ? 'ring-2 ring-blue-500/50' : ''}`}>
              <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </button>
          ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-700/30 pb-3">
        {(['pending', 'approved', 'rejected', 'all'] as ApprovalFilter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${filter === f ? 'bg-blue-600/30 text-blue-400' : 'text-gray-400 hover:text-gray-200'}`}>
            {f === 'all' ? 'All Records' : f}
            {f === 'pending' && pendingCount > 0 && <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-600/30 text-yellow-400 rounded-full">{pendingCount}</span>}
          </button>
        ))}
      </div>

      {/* Search and Actions */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-0">
          <input type="text" placeholder="Search by volunteer or event..." className="input-dark text-sm rounded-lg py-2 px-3 pl-9 w-full"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm"></i>
        </div>
        {filter === 'pending' && selectedItems.length > 0 && (
          <button onClick={handleBulkApprove} className="button-glass-primary hover-lift px-4 py-2 rounded-lg text-sm font-medium">
            <i className="fas fa-check-double mr-2"></i>Approve Selected ({selectedItems.length})
          </button>
        )}
        <button onClick={refetch} className="action-button text-gray-400 hover:text-gray-200 p-2 rounded-lg"><i className="fas fa-sync"></i></button>
      </div>

      {/* Table */}
      <div className="card-glass rounded-xl overflow-hidden">
        <div className="bg-gray-800/30 px-4 py-3 border-b border-gray-700/30">
          <div className={`grid ${layout.isMobile ? 'grid-cols-1' : 'grid-cols-7'} gap-4 items-center`}>
            {!layout.isMobile ? (
              <>
                {filter === 'pending' && <div><input type="checkbox" className="checkbox-custom"
                  checked={selectedItems.length > 0 && selectedItems.length === filteredItems.filter((p) => p.approvalStatus === 'pending').length}
                  onChange={handleSelectAll} /></div>}
                <div className={`${filter === 'pending' ? 'col-span-2' : 'col-span-3'} text-sm font-medium text-gray-300`}>Volunteer</div>
                <div className="col-span-2 text-sm font-medium text-gray-300">Event</div>
                <div className="text-sm font-medium text-gray-300">Hours</div>
                <div className="text-sm font-medium text-gray-300">Actions</div>
              </>
            ) : <div className="text-sm font-medium text-gray-300">Hour Approvals ({filteredItems.length})</div>}
          </div>
        </div>
        <HoursTable participations={filteredItems} selectedItems={selectedItems} loading={loading} isMobile={layout.isMobile}
          filter={filter} onSelectItem={handleSelectItem} onSelectAll={handleSelectAll} onApprove={handleApprove} onReject={handleReject} />
      </div>

      {/* Modal */}
      <ApprovalModal isOpen={showModal} onClose={() => { setShowModal(false); setSelectedParticipation(null) }}
        participation={selectedParticipation} mode={modalMode} onSubmit={handleModalSubmit} />
    </div>
  )
}
