'use client'

/**
 * AdminDashboard Component
 * Uses Server Actions via useAdminDashboard hook (full Drizzle consistency)
 */

import { useAuth } from '@/contexts/AuthContext'
import { useAdminDashboard } from '@/hooks/useAdminDashboard'
import { StatsCard } from '@/components/StatsCard'

interface AdminDashboardProps {
  onNavigate?: (page: string) => void
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { currentUser } = useAuth()
  const { stats, monthlyStats, alerts, recentEvents, loading } = useAdminDashboard()

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-x-hidden overflow-y-auto main-content-bg p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100 mb-2">
          Welcome back, {currentUser?.first_name}!
        </h1>
        <p className="text-gray-400">
          Here's what's happening with NSS VIT today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
            <i className="fas fa-bolt text-yellow-500 mr-3"></i>
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => onNavigate?.('volunteers')}
              className="w-full text-left p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors text-gray-300 hover:text-gray-100"
            >
              <i className="fas fa-user-plus mr-3 text-blue-500"></i>
              Manage Volunteers
            </button>
            <button
              onClick={() => onNavigate?.('events')}
              className="w-full text-left p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors text-gray-300 hover:text-gray-100"
            >
              <i className="fas fa-calendar-plus mr-3 text-green-500"></i>
              Manage Events
            </button>
            <button
              onClick={() => onNavigate?.('hours-approval')}
              className="w-full text-left p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors text-gray-300 hover:text-gray-100"
            >
              <i className="fas fa-clock mr-3 text-orange-500"></i>
              Review Hours
            </button>
            <button
              onClick={() => onNavigate?.('reports')}
              className="w-full text-left p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors text-gray-300 hover:text-gray-100"
            >
              <i className="fas fa-file-export mr-3 text-purple-500"></i>
              Export Reports
            </button>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
            <i className="fas fa-exclamation-triangle text-orange-500 mr-3"></i>
            Alerts & Notifications
          </h3>
          <div className="space-y-3">
            {(alerts?.pendingReviews ?? 0) > 0 ? (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{alerts?.pendingReviews} hour review request{alerts?.pendingReviews !== 1 ? 's' : ''} pending</p>
              </div>
            ) : (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-400">No pending hour reviews</p>
              </div>
            )}
            {(alerts?.eventsEndingSoon ?? 0) > 0 ? (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-400">{alerts?.eventsEndingSoon} event{alerts?.eventsEndingSoon !== 1 ? 's' : ''} ending this week</p>
              </div>
            ) : (
              <div className="p-3 bg-gray-500/10 border border-gray-500/20 rounded-lg">
                <p className="text-sm text-gray-400">No events ending this week</p>
              </div>
            )}
            {(alerts?.newRegistrations ?? 0) > 0 && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-400">New volunteer registrations: {alerts?.newRegistrations}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
            <i className="fas fa-chart-line text-green-500 mr-3"></i>
            This Month
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Hours Logged</span>
              <span className="text-gray-100 font-semibold">{(monthlyStats?.hoursLogged ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Events Created</span>
              <span className="text-gray-100 font-semibold">{monthlyStats?.eventsCreated ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">New Volunteers</span>
              <span className="text-gray-100 font-semibold">{monthlyStats?.newVolunteers ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-100">Recent Events</h2>
          <button
            onClick={() => onNavigate?.('events')}
            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
          >
            View All Events →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentEvents.slice(0, 6).map((event: any) => (
            <div
              key={event.id}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6 hover:bg-gray-800/70 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-100 truncate pr-2">
                  {event.event_name}
                </h3>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {event.event_date ? new Date(event.event_date).toLocaleDateString() : new Date(event.start_date).toLocaleDateString()}
                </span>
              </div>

              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {event.event_description}
              </p>

              <div className="flex justify-between items-center text-sm">
                <span className="text-indigo-400">
                  {event.declared_hours} hours
                </span>
                <span className="text-gray-500">
                  {event.participant_count || 0} participants
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
