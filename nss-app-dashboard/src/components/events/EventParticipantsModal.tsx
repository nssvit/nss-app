'use client'

import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui'
import { supabase } from '@/lib/supabase'

interface Participant {
  id: string
  volunteer_id: string
  first_name: string
  last_name: string
  roll_number: string
  branch: string
  year: string
  email: string
  profile_pic: string | null
  participation_status: string
  hours_attended: number
  registration_date: string
  attendance_date: string | null
  notes: string | null
}

interface EventParticipantsModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  eventName: string
}

const STATUS_COLORS: Record<string, string> = {
  registered: 'text-blue-400 bg-blue-900/30',
  present: 'text-green-400 bg-green-900/30',
  absent: 'text-red-400 bg-red-900/30',
  partially_present: 'text-yellow-400 bg-yellow-900/30',
  excused: 'text-gray-400 bg-gray-700/30',
}

export function EventParticipantsModal({
  isOpen,
  onClose,
  eventId,
  eventName,
}: EventParticipantsModalProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    if (isOpen && eventId) {
      loadParticipants()
    }
  }, [isOpen, eventId])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const loadParticipants = async () => {
    try {
      setLoading(true)

      // First get participation data
      const { data: participationData, error: participationError } = await supabase
        .from('event_participation')
        .select('*')
        .eq('event_id', eventId)
        .order('registration_date', { ascending: true })

      if (participationError) {
        console.error('Participation query error:', participationError)
        throw participationError
      }

      if (!participationData || participationData.length === 0) {
        setParticipants([])
        return
      }

      // Get volunteer IDs
      const volunteerIds = participationData.map((p) => p.volunteer_id).filter(Boolean)

      // Fetch volunteer details (only if we have volunteer IDs)
      let volunteersData: any[] = []
      if (volunteerIds.length > 0) {
        const { data, error: volunteersError } = await supabase
          .from('volunteers')
          .select('id, first_name, last_name, roll_number, branch, year, email, profile_pic')
          .in('id', volunteerIds)

        if (volunteersError) {
          console.error('Volunteers query error:', volunteersError?.message || volunteersError)
        }
        volunteersData = data || []
      }

      // Create a map of volunteers by ID
      const volunteersMap = new Map(volunteersData.map((v) => [v.id, v]))

      // Combine the data
      const formattedParticipants: Participant[] = participationData.map((p: any) => {
        const volunteer = volunteersMap.get(p.volunteer_id)
        return {
          id: p.id,
          volunteer_id: p.volunteer_id,
          first_name: volunteer?.first_name || '',
          last_name: volunteer?.last_name || '',
          roll_number: volunteer?.roll_number || '',
          branch: volunteer?.branch || '',
          year: volunteer?.year || '',
          email: volunteer?.email || '',
          profile_pic: volunteer?.profile_pic || null,
          participation_status: p.participation_status || 'registered',
          hours_attended: p.hours_attended || 0,
          registration_date: p.registration_date,
          attendance_date: p.attendance_date,
          notes: p.notes,
        }
      })

      setParticipants(formattedParticipants)
    } catch (err: any) {
      console.error(
        'Error loading participants:',
        err?.message || err?.code || JSON.stringify(err) || 'Unknown error'
      )
    } finally {
      setLoading(false)
    }
  }

  const filteredParticipants = participants.filter((p) => {
    const matchesSearch = `${p.first_name} ${p.last_name} ${p.roll_number} ${p.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || p.participation_status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: participants.length,
    present: participants.filter((p) =>
      ['present', 'partially_present'].includes(p.participation_status)
    ).length,
    absent: participants.filter((p) => p.participation_status === 'absent').length,
    registered: participants.filter((p) => p.participation_status === 'registered').length,
    totalHours: participants.reduce((sum, p) => sum + (p.hours_attended || 0), 0),
  }

  const handleExportCSV = () => {
    const headers = [
      'Name',
      'Roll Number',
      'Branch',
      'Year',
      'Email',
      'Status',
      'Hours',
      'Registration Date',
    ]
    const rows = filteredParticipants.map((p) => [
      `${p.first_name} ${p.last_name}`,
      p.roll_number,
      p.branch,
      p.year,
      p.email,
      p.participation_status,
      p.hours_attended.toString(),
      p.registration_date ? new Date(p.registration_date).toLocaleDateString() : '',
    ])

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${eventName.replace(/\s+/g, '_')}_participants.csv`
    link.click()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-900/95 p-6 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-100">{eventName}</h2>
            <p className="text-sm text-gray-400">Event Participants</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-2xl leading-none text-gray-500 hover:text-white"
          >
            &times;
          </button>
        </div>

        {/* Stats Row */}
        <div className="mb-4 grid grid-cols-5 gap-3">
          <div className="card-glass rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-indigo-400">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="card-glass rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-green-400">{stats.present}</div>
            <div className="text-xs text-gray-500">Present</div>
          </div>
          <div className="card-glass rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-red-400">{stats.absent}</div>
            <div className="text-xs text-gray-500">Absent</div>
          </div>
          <div className="card-glass rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-blue-400">{stats.registered}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
          <div className="card-glass rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-purple-400">{stats.totalHours}</div>
            <div className="text-xs text-gray-500">Total Hrs</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative min-w-0 flex-1">
            <input
              type="text"
              placeholder="Search participants..."
              className="input-dark w-full rounded-lg px-3 py-2 pl-9 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search absolute top-1/2 left-3 -translate-y-1/2 transform text-sm text-gray-500"></i>
          </div>
          <select
            className="input-dark rounded-lg px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="registered">Registered</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="partially_present">Partial</option>
            <option value="excused">Excused</option>
          </select>
          <button
            onClick={handleExportCSV}
            className="button-glass-secondary rounded-lg px-4 py-2 text-sm"
          >
            <i className="fas fa-download mr-2"></i>
            Export CSV
          </button>
        </div>

        {/* Participants List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={`modal-skeleton-${i}`} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <i className="fas fa-users-slash mb-3 text-4xl"></i>
              <p>No participants found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredParticipants.map((participant, index) => (
                <div
                  key={`participant-${participant.id || index}`}
                  className="card-glass flex items-center gap-4 rounded-lg p-3"
                >
                  {/* Avatar */}
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-700">
                    {participant.profile_pic ? (
                      <img
                        src={participant.profile_pic}
                        alt={participant.first_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-400">
                        {participant.first_name.charAt(0)}
                        {participant.last_name.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-gray-200">
                        {participant.first_name} {participant.last_name}
                      </span>
                      <span className="text-xs text-gray-500">{participant.roll_number}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {participant.branch} | {participant.year} | {participant.email}
                    </div>
                  </div>

                  {/* Status */}
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      STATUS_COLORS[participant.participation_status] ||
                      'bg-gray-700/30 text-gray-400'
                    }`}
                  >
                    {participant.participation_status}
                  </span>

                  {/* Hours */}
                  <div className="min-w-[60px] text-center">
                    <div className="text-sm font-medium text-gray-200">
                      {participant.hours_attended}h
                    </div>
                    <div className="text-xs text-gray-500">hours</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-700/30 pt-4">
          <span className="text-sm text-gray-400">
            Showing {filteredParticipants.length} of {participants.length} participants
          </span>
          <button onClick={onClose} className="button-glass-secondary rounded-lg px-4 py-2 text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
