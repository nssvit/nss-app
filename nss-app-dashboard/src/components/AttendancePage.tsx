'use client'

import { useState } from 'react'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import Image from 'next/image'

interface AttendanceRecord {
  id: number
  eventName: string
  eventDate: string
  totalRegistered: number
  totalAttended: number
  attendanceRate: number
  status: 'Completed' | 'Ongoing' | 'Upcoming'
}

interface ParticipantRecord {
  id: number
  name: string
  email: string
  registrationDate: string
  attendanceStatus: 'Present' | 'Absent' | 'Late' | 'Excused'
  checkInTime?: string
  avatar: string
}

export function AttendancePage() {
  const layout = useResponsiveLayout()
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [attendanceFilter, setAttendanceFilter] = useState('')

  const attendanceRecords: AttendanceRecord[] = [
    {
      id: 1,
      eventName: "Beach Clean-Up Drive",
      eventDate: "Aug 15, 2024",
      totalRegistered: 95,
      totalAttended: 73,
      attendanceRate: 76.8,
      status: "Completed"
    },
    {
      id: 2,
      eventName: "Blood Donation VIT",
      eventDate: "Sep 10, 2024",
      totalRegistered: 150,
      totalAttended: 118,
      attendanceRate: 78.7,
      status: "Completed"
    },
    {
      id: 3,
      eventName: "NSS Camp - Kuderan",
      eventDate: "Nov 27, 2024",
      totalRegistered: 60,
      totalAttended: 48,
      attendanceRate: 80.0,
      status: "Completed"
    },
    {
      id: 4,
      eventName: "Digital Literacy Workshop",
      eventDate: "Dec 5, 2024",
      totalRegistered: 40,
      totalAttended: 32,
      attendanceRate: 80.0,
      status: "Ongoing"
    }
  ]

  const participants: ParticipantRecord[] = [
    {
      id: 1,
      name: "Arjun Patel",
      email: "arjun.patel@vitstudent.ac.in",
      registrationDate: "Aug 12, 2024",
      attendanceStatus: "Present",
      checkInTime: "09:15 AM",
      avatar: "https://i.imgur.com/gVo4gxC.png"
    },
    {
      id: 2,
      name: "Priya Sharma",
      email: "priya.sharma@vitstudent.ac.in",
      registrationDate: "Aug 13, 2024",
      attendanceStatus: "Present",
      checkInTime: "09:22 AM",
      avatar: "https://i.imgur.com/7OtnwP9.png"
    },
    {
      id: 3,
      name: "Raj Kumar",
      email: "raj.kumar@vitstudent.ac.in",
      registrationDate: "Aug 10, 2024",
      attendanceStatus: "Late",
      checkInTime: "10:45 AM",
      avatar: "https://i.imgur.com/xG2942s.png"
    },
    {
      id: 4,
      name: "Sneha Reddy",
      email: "sneha.reddy@vitstudent.ac.in",
      registrationDate: "Aug 14, 2024",
      attendanceStatus: "Absent",
      avatar: "https://i.imgur.com/gJgRz7n.png"
    }
  ]

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

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.eventName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || record.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAttendance = !attendanceFilter || participant.attendanceStatus === attendanceFilter
    return matchesSearch && matchesAttendance
  })

  return (
    <div className={`flex-1 overflow-x-hidden overflow-y-auto main-content-bg mobile-scroll safe-area-bottom ${layout.getContentPadding()}`}>
      {/* Summary Cards */}
      <div className={`grid ${layout.isMobile ? 'grid-cols-1' : layout.isTablet ? 'grid-cols-2' : 'grid-cols-4'} gap-4 mb-6`}>
        <div className="card-glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-lg bg-blue-900/30 flex items-center justify-center">
              <i className="fas fa-calendar-check text-lg text-blue-400"></i>
            </div>
            <div className="text-sm text-green-400">
              <i className="fas fa-arrow-up text-xs mr-1"></i>
              +5%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-100 mb-1">248</h3>
          <p className="text-sm text-gray-400">Total Events</p>
        </div>

        <div className="card-glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-lg bg-green-900/30 flex items-center justify-center">
              <i className="fas fa-user-check text-lg text-green-400"></i>
            </div>
            <div className="text-sm text-green-400">
              <i className="fas fa-arrow-up text-xs mr-1"></i>
              +12%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-100 mb-1">78.5%</h3>
          <p className="text-sm text-gray-400">Avg. Attendance</p>
        </div>

        <div className="card-glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-lg bg-purple-900/30 flex items-center justify-center">
              <i className="fas fa-users text-lg text-purple-400"></i>
            </div>
            <div className="text-sm text-green-400">
              <i className="fas fa-arrow-up text-xs mr-1"></i>
              +8%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-100 mb-1">1,847</h3>
          <p className="text-sm text-gray-400">Total Participants</p>
        </div>

        <div className="card-glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-lg bg-orange-900/30 flex items-center justify-center">
              <i className="fas fa-clock text-lg text-orange-400"></i>
            </div>
            <div className="text-sm text-green-400">
              <i className="fas fa-arrow-up text-xs mr-1"></i>
              +15%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-100 mb-1">12,486</h3>
          <p className="text-sm text-gray-400">Total Hours</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={`flex flex-wrap items-center gap-3 mb-6 ${layout.isMobile ? 'px-0' : 'px-1'}`}>
        <div className="relative flex-1 min-w-0">
          <input 
            type="text" 
            placeholder="Search events or participants..." 
            className="input-dark text-sm rounded-lg py-2 px-3 pl-9 focus:outline-none placeholder-gray-500 focus-visible w-full" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm"></i>
        </div>

        <select 
          className="input-dark text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
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
            className="input-dark text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
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
          className="text-gray-500 hover:text-gray-300 text-sm py-2 px-3 transition-colors focus-visible rounded"
          onClick={clearFilters}
        >
          Clear
        </button>
      </div>

      {/* Content Area */}
      <div className={`grid ${layout.isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-6`}>
        {/* Events List */}
        <div className="card-glass rounded-xl overflow-hidden">
          <div className="bg-gray-800/30 px-4 py-3 border-b border-gray-700/30">
            <h3 className="text-lg font-semibold text-gray-100">Event Attendance</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <div className="divide-y divide-gray-700/30">
              {filteredRecords.map((record) => (
                <div 
                  key={record.id} 
                  className={`px-4 py-3 hover:bg-gray-800/20 transition-colors cursor-pointer ${
                    selectedEvent === record.id ? 'bg-indigo-900/20' : ''
                  }`}
                  onClick={() => setSelectedEvent(record.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-200 text-sm">{record.eventName}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{record.eventDate}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-xs">
                        <span className="text-gray-400">Registered:</span> 
                        <span className="text-gray-300 ml-1">{record.totalRegistered}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-400">Attended:</span> 
                        <span className="text-gray-300 ml-1">{record.totalAttended}</span>
                      </div>
                    </div>
                    <div className={`text-xs font-medium ${getAttendanceRateColor(record.attendanceRate)}`}>
                      {record.attendanceRate}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Participants List */}
        <div className="card-glass rounded-xl overflow-hidden">
          <div className="bg-gray-800/30 px-4 py-3 border-b border-gray-700/30">
            <h3 className="text-lg font-semibold text-gray-100">
              {selectedEvent ? `Participants - ${attendanceRecords.find(r => r.id === selectedEvent)?.eventName}` : 'Select an event to view participants'}
            </h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {selectedEvent ? (
              <div className="divide-y divide-gray-700/30">
                {filteredParticipants.map((participant) => (
                  <div key={participant.id} className="px-4 py-3 hover:bg-gray-800/20 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Image 
                        src={participant.avatar}
                        alt={participant.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-200 text-sm">{participant.name}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${getAttendanceColor(participant.attendanceStatus)}`}>
                            {participant.attendanceStatus}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{participant.email}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-400">Registered: {participant.registrationDate}</span>
                          {participant.checkInTime && (
                            <span className="text-xs text-gray-400">Check-in: {participant.checkInTime}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <i className="fas fa-users text-4xl mb-3"></i>
                  <p>Select an event to view participants</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center mt-6 space-x-3">
        <button className="pwa-button button-glass-primary hover-lift flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium focus-visible">
          <i className="fas fa-download fa-sm"></i>
          <span>Export Attendance</span>
        </button>
        <button className="pwa-button button-glass-secondary hover-lift flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium focus-visible">
          <i className="fas fa-user-check fa-sm"></i>
          <span>Mark Attendance</span>
        </button>
        <button className="pwa-button button-glass-secondary hover-lift flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium focus-visible">
          <i className="fas fa-chart-line fa-sm"></i>
          <span>View Analytics</span>
        </button>
      </div>
    </div>
  )
} 