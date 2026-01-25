'use client'

import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui'
import { useAttendance } from '@/hooks/useAttendance'
import type { EventParticipant } from '@/hooks/useAttendance'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'

interface AttendanceRecord {
  id: string
  eventName: string
  eventDate: string
  totalRegistered: number
  totalAttended: number
  attendanceRate: number
  status: 'Completed' | 'Ongoing' | 'Upcoming'
  categoryName: string
}

interface ParticipantRecord {
  id: string
  name: string
  email: string
  registrationDate: string
  attendanceStatus: 'Present' | 'Absent' | 'Late' | 'Excused'
  checkInTime?: string
  avatar: string
}

export function AttendancePage() {
  const layout = useResponsiveLayout()
  const { attendanceRecords: dbRecords, loading, getEventParticipants } = useAttendance()
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [attendanceFilter, setAttendanceFilter] = useState('')
  const [participants, setParticipants] = useState<EventParticipant[]>([])
  const [loadingParticipants, setLoadingParticipants] = useState(false)

  // Transform database attendance records to component format
  const attendanceRecords: AttendanceRecord[] = dbRecords.map((record) => ({
    id: record.event_id,
    eventName: record.event_name,
    eventDate: record.event_date
      ? new Date(record.event_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'No date',
    totalRegistered: Number(record.total_registered),
    totalAttended: Number(record.total_present),
    attendanceRate: Number(record.attendance_rate),
    status: 'Completed' as const, // You can derive this from event status
    categoryName: record.category_name,
  }))

  // Load participants when an event is selected
  useEffect(() => {
    if (selectedEvent) {
      setLoadingParticipants(true)
      getEventParticipants(selectedEvent).then((data) => {
        setParticipants(data)
        setLoadingParticipants(false)
      })
    }
  }, [selectedEvent, getEventParticipants])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'text-green-400 bg-green-900/30'
      case 'Ongoing':
        return 'text-yellow-400 bg-yellow-900/30'
      case 'Upcoming':
        return 'text-blue-400 bg-blue-900/30'
      default:
        return 'text-gray-400 bg-gray-900/30'
    }
  }

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'text-green-400 bg-green-900/30'
      case 'Late':
        return 'text-yellow-400 bg-yellow-900/30'
      case 'Absent':
        return 'text-red-400 bg-red-900/30'
      case 'Excused':
        return 'text-blue-400 bg-blue-900/30'
      default:
        return 'text-gray-400 bg-gray-900/30'
    }
  }

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-400'
    if (rate >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setAttendanceFilter('')
  }

  const filteredRecords = attendanceRecords.filter((record) => {
    const matchesSearch = record.eventName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || record.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredParticipants = participants.filter((participant) => {
    const name = participant.volunteer_name || participant.volunteerName || ''
    const email = participant.rollNumber || participant.roll_number || ''
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase())
    const status = participant.participation_status || participant.participationStatus || ''
    const attendanceStatus =
      status === 'present'
        ? 'Present'
        : status === 'absent'
          ? 'Absent'
          : status === 'excused'
            ? 'Excused'
            : 'Registered'
    const matchesAttendance = !attendanceFilter || attendanceStatus === attendanceFilter
    return matchesSearch && matchesAttendance
  })

  // Calculate stats from actual data
  const totalEvents = dbRecords.length
  const totalParticipants = dbRecords.reduce(
    (sum, record) => sum + Number(record.total_registered),
    0
  )
  const totalPresent = dbRecords.reduce((sum, record) => sum + Number(record.total_present), 0)
  const avgAttendance =
    totalParticipants > 0 ? ((totalPresent / totalParticipants) * 100).toFixed(1) : '0.0'
  const totalHours = dbRecords.reduce((sum, record) => sum + Number(record.total_hours), 0)

  return (
    <div
      className={`main-content-bg mobile-scroll safe-area-bottom flex-1 overflow-x-hidden overflow-y-auto ${layout.getContentPadding()}`}
    >
      {/* Summary Cards */}
      <div
        className={`grid ${layout.isMobile ? 'grid-cols-1' : layout.isTablet ? 'grid-cols-2' : 'grid-cols-4'} mb-6 gap-4`}
      >
        {loading ? (
          <>
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </>
        ) : (
          <>
            <div className="card-glass rounded-xl p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-900/30">
                  <i className="fas fa-calendar-check text-lg text-blue-400"></i>
                </div>
              </div>
              <h3 className="mb-1 text-2xl font-bold text-gray-100">{totalEvents}</h3>
              <p className="text-sm text-gray-400">Total Events</p>
            </div>

            <div className="card-glass rounded-xl p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-900/30">
                  <i className="fas fa-user-check text-lg text-green-400"></i>
                </div>
              </div>
              <h3 className="mb-1 text-2xl font-bold text-gray-100">{avgAttendance}%</h3>
              <p className="text-sm text-gray-400">Avg. Attendance</p>
            </div>

            <div className="card-glass rounded-xl p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-900/30">
                  <i className="fas fa-users text-lg text-purple-400"></i>
                </div>
              </div>
              <h3 className="mb-1 text-2xl font-bold text-gray-100">
                {totalParticipants.toLocaleString()}
              </h3>
              <p className="text-sm text-gray-400">Total Participants</p>
            </div>

            <div className="card-glass rounded-xl p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-900/30">
                  <i className="fas fa-clock text-lg text-orange-400"></i>
                </div>
              </div>
              <h3 className="mb-1 text-2xl font-bold text-gray-100">
                {totalHours.toLocaleString()}
              </h3>
              <p className="text-sm text-gray-400">Total Hours</p>
            </div>
          </>
        )}
      </div>

      {/* Search and Filters */}
      <div
        className={`mb-6 flex flex-wrap items-center gap-3 ${layout.isMobile ? 'px-0' : 'px-1'}`}
      >
        <div className="relative min-w-0 flex-1">
          <input
            type="text"
            placeholder="Search events or participants..."
            className="input-dark focus-visible w-full rounded-lg px-3 py-2 pl-9 text-sm placeholder-gray-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="fas fa-search absolute top-1/2 left-3 -translate-y-1/2 transform text-sm text-gray-500"></i>
        </div>

        <select
          className="input-dark focus-visible rounded-lg px-3 py-2 text-sm focus:outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Completed">Completed</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Upcoming">Upcoming</option>
        </select>

        {selectedEvent && (
          <select
            className="input-dark focus-visible rounded-lg px-3 py-2 text-sm focus:outline-none"
            value={attendanceFilter}
            onChange={(e) => setAttendanceFilter(e.target.value)}
          >
            <option value="">All Attendance</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Absent">Absent</option>
            <option value="Excused">Excused</option>
          </select>
        )}

        <button
          className="focus-visible rounded px-3 py-2 text-sm text-gray-500 transition-colors hover:text-gray-300"
          onClick={clearFilters}
        >
          Clear
        </button>
      </div>

      {/* Content Area */}
      <div className={`grid ${layout.isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-6`}>
        {/* Events List */}
        <div className="card-glass overflow-hidden rounded-xl">
          <div className="border-b border-gray-700/30 bg-gray-800/30 px-4 py-3">
            <h3 className="text-lg font-semibold text-gray-100">Event Attendance</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <div className="divide-y divide-gray-700/30">
              {filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className={`cursor-pointer px-4 py-3 transition-colors hover:bg-gray-800/20 ${
                    selectedEvent === record.id ? 'bg-indigo-900/20' : ''
                  }`}
                  onClick={() => setSelectedEvent(record.id)}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-200">{record.eventName}</h4>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${getStatusColor(record.status)}`}
                    >
                      {record.status}
                    </span>
                  </div>
                  <p className="mb-3 text-xs text-gray-500">{record.eventDate}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-xs">
                        <span className="text-gray-400">Registered:</span>
                        <span className="ml-1 text-gray-300">{record.totalRegistered}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-400">Attended:</span>
                        <span className="ml-1 text-gray-300">{record.totalAttended}</span>
                      </div>
                    </div>
                    <div
                      className={`text-xs font-medium ${getAttendanceRateColor(record.attendanceRate)}`}
                    >
                      {record.attendanceRate}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Participants List */}
        <div className="card-glass overflow-hidden rounded-xl">
          <div className="border-b border-gray-700/30 bg-gray-800/30 px-4 py-3">
            <h3 className="text-lg font-semibold text-gray-100">
              {selectedEvent
                ? `Participants - ${attendanceRecords.find((r) => r.id === selectedEvent)?.eventName}`
                : 'Select an event to view participants'}
            </h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {selectedEvent ? (
              <div className="divide-y divide-gray-700/30">
                {filteredParticipants.map((participant) => {
                  const name = participant.volunteer_name || participant.volunteerName || 'Unknown'
                  const rollNumber = participant.roll_number || participant.rollNumber || ''
                  const status =
                    participant.participation_status ||
                    participant.participationStatus ||
                    'registered'
                  const attendanceStatus =
                    status === 'present'
                      ? 'Present'
                      : status === 'absent'
                        ? 'Absent'
                        : status === 'excused'
                          ? 'Excused'
                          : 'Registered'
                  const hours = participant.hours_attended ?? participant.hoursAttended ?? 0
                  const regDate = participant.registration_date || participant.registrationDate

                  return (
                    <div
                      key={participant.participant_id || participant.participantId}
                      className="px-4 py-3 transition-colors hover:bg-gray-800/20"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-medium text-white">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-200">{name}</h4>
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${getAttendanceColor(attendanceStatus)}`}
                            >
                              {attendanceStatus}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {rollNumber} | {hours}h attended
                          </p>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {regDate
                                ? `Registered: ${new Date(regDate).toLocaleDateString()}`
                                : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-gray-500">
                <div className="text-center">
                  <i className="fas fa-users mb-3 text-4xl"></i>
                  <p>Select an event to view participants</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-center space-x-3">
        <button className="pwa-button button-glass-primary hover-lift focus-visible flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium">
          <i className="fas fa-download fa-sm"></i>
          <span>Export Attendance</span>
        </button>
        <button className="pwa-button button-glass-secondary hover-lift focus-visible flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium">
          <i className="fas fa-user-check fa-sm"></i>
          <span>Mark Attendance</span>
        </button>
        <button className="pwa-button button-glass-secondary hover-lift focus-visible flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium">
          <i className="fas fa-chart-line fa-sm"></i>
          <span>View Analytics</span>
        </button>
      </div>
    </div>
  )
}
