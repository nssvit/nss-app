'use client'

/**
 * HeadsDashboard Component
 * Uses Server Actions via useHeadsDashboard hook (full Drizzle consistency)
 */

import { StatsCard } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useHeadsDashboard } from '@/hooks/useHeadsDashboard'

interface HeadsDashboardProps {
  onNavigate?: (page: string) => void
}

export function HeadsDashboard({ onNavigate }: HeadsDashboardProps) {
  const { currentUser } = useAuth()
  const { stats, myEvents, volunteerHours, loading } = useHeadsDashboard()

  const getRoleDisplayName = (roles: string[]) => {
    if (roles.includes('program_officer')) return 'Program Officer'
    if (roles.includes('documentation_lead')) return 'Documentation Lead'
    if (roles.includes('event_lead')) return 'Event Lead'
    return 'Head'
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="main-content-bg flex-1 overflow-x-hidden overflow-y-auto p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-100">
          Welcome, {currentUser?.first_name}!
        </h1>
        <p className="text-gray-400">
          {getRoleDisplayName(currentUser?.roles || [])} Dashboard - Manage events and track
          volunteer progress
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="My Events"
          value={stats?.myEvents ?? 0}
          icon="fas fa-calendar-check"
          variant="primary"
        />
        <StatsCard
          title="Total Participants"
          value={stats?.totalParticipants ?? 0}
          icon="fas fa-users"
          variant="success"
        />
        <StatsCard
          title="Hours Managed"
          value={stats?.hoursManaged ?? 0}
          icon="fas fa-clock"
          variant="purple"
        />
        <StatsCard
          title="Active Events"
          value={stats?.activeEvents ?? 0}
          icon="fas fa-calendar-day"
          variant="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* My Recent Events */}
        <div className="rounded-xl border border-gray-700/30 bg-gray-800/50 p-6 backdrop-blur-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="flex items-center text-lg font-semibold text-gray-100">
              <i className="fas fa-calendar-alt mr-3 text-blue-500"></i>
              My Recent Events
            </h3>
            <button
              onClick={() => onNavigate?.('events')}
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
            >
              View All →
            </button>
          </div>

          <div className="space-y-4">
            {myEvents.slice(0, 5).map((event: any) => (
              <div
                key={event.id}
                className="rounded-lg bg-gray-700/30 p-4 transition-colors hover:bg-gray-700/50"
              >
                <div className="mb-2 flex items-start justify-between">
                  <h4 className="truncate pr-2 font-medium text-gray-100">{event.event_name}</h4>
                  <span className="text-xs whitespace-nowrap text-gray-400">
                    {new Date(event.event_date || event.start_date).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{event.participant_count || 0} participants</span>
                  <span className="text-indigo-400">{event.declared_hours} hours</span>
                </div>
              </div>
            ))}

            {myEvents.length === 0 && (
              <div className="py-8 text-center">
                <i className="fas fa-calendar-plus mb-4 text-4xl text-gray-600"></i>
                <p className="mb-4 text-gray-400">No events created yet</p>
                <button className="button-glass-primary rounded-lg px-4 py-2">
                  Create Your First Event
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Volunteer Hours Overview */}
        <div className="rounded-xl border border-gray-700/30 bg-gray-800/50 p-6 backdrop-blur-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="flex items-center text-lg font-semibold text-gray-100">
              <i className="fas fa-chart-bar mr-3 text-green-500"></i>
              Volunteer Hours Overview
            </h3>
            <button
              onClick={() => onNavigate?.('volunteers')}
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
            >
              View Details →
            </button>
          </div>

          <div className="space-y-4">
            {volunteerHours.map((volunteer, index) => (
              <div
                key={volunteer.volunteer_id}
                className="flex items-center justify-between rounded-lg bg-gray-700/30 p-3"
              >
                <div className="flex items-center">
                  <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-sm font-medium text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-100">{volunteer.volunteer_name}</p>
                    <p className="text-sm text-gray-400">{volunteer.events_count} events</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-100">{volunteer.total_hours}h</p>
                  {volunteer.last_activity && (
                    <p className="text-xs text-gray-400">
                      {new Date(volunteer.last_activity).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {volunteerHours.length === 0 && (
              <div className="py-8 text-center">
                <i className="fas fa-chart-bar mb-4 text-4xl text-gray-600"></i>
                <p className="text-gray-400">No volunteer data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <button
          onClick={() => onNavigate?.('events')}
          className="rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-600/20 to-blue-800/20 p-6 text-left transition-colors hover:from-blue-600/30 hover:to-blue-800/30"
        >
          <i className="fas fa-calendar-plus mb-3 text-2xl text-blue-400"></i>
          <h4 className="mb-2 font-semibold text-gray-100">Create New Event</h4>
          <p className="text-sm text-gray-400">Organize a new NSS activity</p>
        </button>

        <button
          onClick={() => onNavigate?.('attendance-manager')}
          className="rounded-xl border border-green-500/30 bg-gradient-to-r from-green-600/20 to-green-800/20 p-6 text-left transition-colors hover:from-green-600/30 hover:to-green-800/30"
        >
          <i className="fas fa-user-check mb-3 text-2xl text-green-400"></i>
          <h4 className="mb-2 font-semibold text-gray-100">Mark Attendance</h4>
          <p className="text-sm text-gray-400">Record event attendance</p>
        </button>

        <button
          onClick={() => onNavigate?.('reports')}
          className="rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-600/20 to-purple-800/20 p-6 text-left transition-colors hover:from-purple-600/30 hover:to-purple-800/30"
        >
          <i className="fas fa-file-alt mb-3 text-2xl text-purple-400"></i>
          <h4 className="mb-2 font-semibold text-gray-100">Generate Report</h4>
          <p className="text-sm text-gray-400">Create activity reports</p>
        </button>
      </div>
    </div>
  )
}
