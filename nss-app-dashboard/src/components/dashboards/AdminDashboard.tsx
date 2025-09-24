'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { EventCard } from '@/components/EventCard'
import { StatsCard } from '@/components/StatsCard'

interface DashboardStats {
  totalVolunteers: number
  totalEvents: number
  totalHours: number
  pendingReviews: number
  activeEvents: number
}

export function AdminDashboard() {
  const { currentUser } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalVolunteers: 0,
    totalEvents: 0,
    totalHours: 0,
    pendingReviews: 0,
    activeEvents: 0
  })
  const [recentEvents, setRecentEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load dashboard statistics
      const [volunteersData, eventsData, participationData] = await Promise.all([
        supabase.from('volunteers').select('*', { count: 'exact' }),
        supabase.from('events').select('*', { count: 'exact' }),
        supabase.from('event_participation').select('declared_hours', { count: 'exact' })
      ])

      // Calculate total hours
      const totalHours = participationData.data?.reduce((sum, p) => sum + (p.declared_hours || 0), 0) || 0

      // Load active events count
      const { count: activeEventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .gte('event_date', new Date().toISOString())

      setStats({
        totalVolunteers: volunteersData.count || 0,
        totalEvents: eventsData.count || 0,
        totalHours,
        pendingReviews: 0, // TODO: Implement review system
        activeEvents: activeEventsCount || 0
      })

      // Load recent events
      const { data: events } = await supabase
        .from('events')
        .select(`
          *,
          volunteers:created_by_volunteer_id (first_name, last_name),
          event_categories (category_name),
          event_participation (count)
        `)
        .order('created_at', { ascending: false })
        .limit(6)

      setRecentEvents(events || [])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

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
          value={stats.totalVolunteers}
          icon="fas fa-users"
          color="blue"
        />
        <StatsCard
          title="Total Events"
          value={stats.totalEvents}
          icon="fas fa-calendar-check"
          color="green"
        />
        <StatsCard
          title="Active Events"
          value={stats.activeEvents}
          icon="fas fa-calendar-day"
          color="yellow"
        />
        <StatsCard
          title="Total Hours"
          value={stats.totalHours}
          icon="fas fa-clock"
          color="purple"
        />
        <StatsCard
          title="Pending Reviews"
          value={stats.pendingReviews}
          icon="fas fa-clipboard-check"
          color="red"
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
            <button className="w-full text-left p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors text-gray-300 hover:text-gray-100">
              <i className="fas fa-user-plus mr-3 text-blue-500"></i>
              Add New Volunteer
            </button>
            <button className="w-full text-left p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors text-gray-300 hover:text-gray-100">
              <i className="fas fa-calendar-plus mr-3 text-green-500"></i>
              Create New Event
            </button>
            <button className="w-full text-left p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors text-gray-300 hover:text-gray-100">
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
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">5 hour review requests pending</p>
            </div>
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-400">3 events ending this week</p>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-400">New volunteer registrations: 12</p>
            </div>
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
              <span className="text-gray-100 font-semibold">1,248</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Events Created</span>
              <span className="text-gray-100 font-semibold">23</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">New Volunteers</span>
              <span className="text-gray-100 font-semibold">47</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-100">Recent Events</h2>
          <button className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
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
                  {new Date(event.event_date).toLocaleDateString()}
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
                  {event.event_participation?.length || 0} participants
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}