'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import type { EventParticipationWithVolunteer } from '@/types'
import { cn } from '@/lib/utils'
import { useHours } from '@/hooks/use-hours'
import { useMediaQuery } from '@/hooks/use-media-query'
import { usePagination } from '@/hooks/use-pagination'
import { PageHeader } from '@/components/page-header'
import { TablePagination } from '@/components/table-pagination'
import { HoursCardList } from './hours-card-list'
import { ViewToggle } from '@/components/ui/view-toggle'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { HoursTable } from './hours-table'
import { ApprovalModal } from './approval-modal'

export function HoursPage() {
  const { pendingApprovals, loading, approveHours, rejectHours } = useHours()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [view, setView] = useState<'grid' | 'list'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    setView(isMobile ? 'grid' : 'list')
  }, [isMobile])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedParticipation, setSelectedParticipation] =
    useState<EventParticipationWithVolunteer | null>(null)
  const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve')

  const filteredApprovals = pendingApprovals.filter((p) => {
    const name =
      p.volunteerName ?? (p.volunteer ? `${p.volunteer.firstName} ${p.volunteer.lastName}` : '')
    const matchesSearch =
      searchQuery === '' ||
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.eventId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.volunteerId.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || p.approvalStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  const { paginatedItems, currentPage, totalPages, totalItems, setCurrentPage } = usePagination(filteredApprovals, 20)

  const handleApprove = (participation: EventParticipationWithVolunteer) => {
    setSelectedParticipation(participation)
    setModalAction('approve')
    setModalOpen(true)
  }

  const handleReject = (participation: EventParticipationWithVolunteer) => {
    setSelectedParticipation(participation)
    setModalAction('reject')
    setModalOpen(true)
  }

  const handleConfirm = async () => {
    if (!selectedParticipation) return
    if (modalAction === 'approve') {
      await approveHours(selectedParticipation.id)
    } else {
      await rejectHours(selectedParticipation.id)
    }
    setModalOpen(false)
    setSelectedParticipation(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hours Approval"
        description="Review and approve volunteer hours submissions."
      />

      <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-center')}>
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by volunteer name, event, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {view === 'grid' ? (
        <HoursCardList
          participations={paginatedItems}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      ) : (
        <HoursTable
          participations={paginatedItems}
          loading={loading}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
      />

      <ApprovalModal
        participation={selectedParticipation}
        action={modalAction}
        onConfirm={handleConfirm}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  )
}
