'use client'

/**
 * AdminDashboard Component
 * Uses Server Actions via useAdminDashboard hook (full Drizzle consistency)
 */

import { StatsCard } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminDashboard } from '@/hooks/useAdminDashboard'

interface AdminDashboardProps {
  onNavigate?: (page: string) => void
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { currentUser } = useAuth()
  const { stats, monthlyStats, alerts, recentEvents, loading } = useAdminDashboard()

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500"></div>
          <p className="text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="main-content-bg flex-1 overflow-x-hidden overflow-y-auto p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-100">
          Welcome back, {currentUser?.first_name}!
        </h1>
        <p className="text-gray-400">Here's what's happening with NSS VIT today.</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Total Volunteers"
          value={stats?.totalVolunteers ?? 0}
          icon="fas fa-users"
          variant="primary"
        />
        <StatsCard
          title="Total Events"
          value={stats?.totalEvents ?? 0}
          icon="fas fa-calendar-check"
          variant="success"
        />
        <StatsCard
          title="Active Events"
          value={stats?.activeEvents ?? 0}
          icon="fas fa-calendar-day"
          variant="warning"
        />
        <StatsCard
          title="Total Hours"
          value={stats?.totalHours ?? 0}
          icon="fas fa-clock"
          variant="purple"
        />
        <StatsCard
          title="Pending Reviews"
          value={stats?.pendingReviews ?? 0}
          icon="fas fa-clipboard-check"
          variant="error"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-700/30 bg-gray-800/50 p-6 backdrop-blur-sm">
          <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-100">
            <i className="fas fa-bolt mr-3 text-yellow-500"></i>
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => onNavigate?.('volunteers')}
              className="w-full rounded-lg bg-gray-700/30 p-3 text-left text-gray-300 transition-colors hover:bg-gray-700/50 hover:text-gray-100"
            >
              <i className="fas fa-user-plus mr-3 text-blue-500"></i>
              Manage Volunteers
            </button>
            <button
              onClick={() => onNavigate?.('events')}
              className="w-full rounded-lg bg-gray-700/30 p-3 text-left text-gray-300 transition-colors hover:bg-gray-700/50 hover:text-gray-100"
            >
              <i className="fas fa-calendar-plus mr-3 text-green-500"></i>
              Manage Events
            </button>
            <button
              onClick={() => onNavigate?.('hours-approval')}
              className="w-full rounded-lg bg-gray-700/30 p-3 text-left text-gray-300 transition-colors hover:bg-gray-700/50 hover:text-gray-100"
            >
              <i className="fas fa-clock mr-3 text-orange-500"></i>
              Review Hours
            </button>
            <button
              onClick={() => onNavigate?.('reports')}
              className="w-full rounded-lg bg-gray-700/30 p-3 text-left text-gray-300 transition-colors hover:bg-gray-700/50 hover:text-gray-100"
            >
              <i className="fas fa-file-export mr-3 text-purple-500"></i>
              Export Reports
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-700/30 bg-gray-800/50 p-6 backdrop-blur-sm">
          <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-100">
            <i className="fas fa-exclamation-triangle mr-3 text-orange-500"></i>
            Alerts & Notifications
          </h3>
          <div className="space-y-3">
            {(alerts?.pendingReviews ?? 0) > 0 ? (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                <p className="text-sm text-red-400">
                  {alerts?.pendingReviews} hour review request
                  {alerts?.pendingReviews !== 1 ? 's' : ''} pending
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3">
                <p className="text-sm text-green-400">No pending hour reviews</p>
              </div>
            )}
            {(alerts?.eventsEndingSoon ?? 0) > 0 ? (
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3">
                <p className="text-sm text-yellow-400">
                  {alerts?.eventsEndingSoon} event{alerts?.eventsEndingSoon !== 1 ? 's' : ''} ending
                  this week
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-500/20 bg-gray-500/10 p-3">
                <p className="text-sm text-gray-400">No events ending this week</p>
              </div>
            )}
            {(alerts?.newRegistrations ?? 0) > 0 && (
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
                <p className="text-sm text-blue-400">
                  New volunteer registrations: {alerts?.newRegistrations}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-700/30 bg-gray-800/50 p-6 backdrop-blur-sm">
          <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-100">
            <i className="fas fa-chart-line mr-3 text-green-500"></i>
            This Month
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Hours Logged</span>
              <span className="font-semibold text-gray-100">
                {(monthlyStats?.hoursLogged ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Events Created</span>
              <span className="font-semibold text-gray-100">
                {monthlyStats?.eventsCreated ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">New Volunteers</span>
              <span className="font-semibold text-gray-100">
                {monthlyStats?.newVolunteers ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="mb-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-100">Recent Events</h2>
          <button
            onClick={() => onNavigate?.('events')}
            className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
          >
            View All Events →
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recentEvents.slice(0, 6).map((event: any) => (
            <div
              key={event.id}
              className="rounded-xl border border-gray-700/30 bg-gray-800/50 p-6 backdrop-blur-sm transition-colors hover:bg-gray-800/70"
            >
              <div className="mb-3 flex items-start justify-between">
                <h3 className="truncate pr-2 font-semibold text-gray-100">{event.event_name}</h3>
                <span className="text-xs whitespace-nowrap text-gray-400">
                  {event.event_date
                    ? new Date(event.event_date).toLocaleDateString()
                    : new Date(event.start_date).toLocaleDateString()}
                </span>
              </div>

              <p className="mb-4 line-clamp-2 text-sm text-gray-400">{event.event_description}</p>

              <div className="flex items-center justify-between text-sm">
                <span className="text-indigo-400">{event.declared_hours} hours</span>
                <span className="text-gray-500">{event.participant_count || 0} participants</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
