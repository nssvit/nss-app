'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { StatsCard } from '@/components/StatsCard'

interface HeadsDashboardStats {
  myEvents: number
  totalParticipants: number
  hoursManaged: number
  activeEvents: number
}

interface VolunteerHours {
  volunteer_id: string
  volunteer_name: string
  total_hours: number
  events_count: number
  last_activity: string
}

interface HeadsDashboardProps {
  onNavigate?: (page: string) => void
}

export function HeadsDashboard({ onNavigate }: HeadsDashboardProps) {
  const { currentUser } = useAuth()
  const [stats, setStats] = useState<HeadsDashboardStats>({
    myEvents: 0,
    totalParticipants: 0,
    hoursManaged: 0,
    activeEvents: 0
  })
  const [myEvents, setMyEvents] = useState([])
  const [volunteerHours, setVolunteerHours] = useState<VolunteerHours[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHeadsDashboardData()
  }, [currentUser])

  const loadHeadsDashboardData = async () => {
    if (!currentUser?.volunteer_id) return

    try {
      // Load events created by this head
      const { data: myEventsData } = await supabase
        .from('events')
        .select(`
          *,
          event_categories (category_name),
          event_participation (
            volunteer_id,
            declared_hours,
            volunteers (first_name, last_name)
          )
        `)
        .eq('created_by_volunteer_id', currentUser.volunteer_id)
        .order('created_at', { ascending: false })

      setMyEvents(myEventsData || [])

      // Calculate statistics
      const totalParticipants = myEventsData?.reduce(
        (sum, event) => sum + (event.event_participation?.length || 0), 0
      ) || 0

      const hoursManaged = myEventsData?.reduce((sum, event) =>
        sum + (event.event_participation?.reduce((hourSum: number, p: any) =>
          hourSum + (p.declared_hours || 0), 0
        ) || 0), 0
      ) || 0

      const activeEvents = myEventsData?.filter(event =>
        event.is_active && new Date(event.event_date) >= new Date()
      ).length || 0

      setStats({
        myEvents: myEventsData?.length || 0,
        totalParticipants,
        hoursManaged,
        activeEvents
      })

      // Load volunteer hours summary (limited view for heads)
      const { data: hoursData } = await supabase.rpc('get_volunteer_hours_summary')

      if (hoursData) {
        setVolunteerHours(hoursData.slice(0, 10)) // Show top 10
      }

    } catch (error) {
      console.error('Error loading heads dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleDisplayName = (roles: string[]) => {
    if (roles.includes('program_officer')) return 'Program Officer'
    if (roles.includes('documentation_lead')) return 'Documentation Lead'
    if (roles.includes('event_lead')) return 'Event Lead'
    return 'Head'
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-x-hidden overflow-y-auto main-content-bg p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100 mb-2">
          Welcome, {currentUser?.first_name}!
        </h1>
        <p className="text-gray-400">
          {getRoleDisplayName(currentUser?.roles || [])} Dashboard - Manage events and track volunteer progress
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="My Events"
          value={stats.myEvents}
          icon="fas fa-calendar-check"
          color="blue"
        />
        <StatsCard
          title="Total Participants"
          value={stats.totalParticipants}
          icon="fas fa-users"
          color="green"
        />
        <StatsCard
          title="Hours Managed"
          value={stats.hoursManaged}
          icon="fas fa-clock"
          color="purple"
        />
        <StatsCard
          title="Active Events"
          value={stats.activeEvents}
          icon="fas fa-calendar-day"
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Recent Events */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-100 flex items-center">
              <i className="fas fa-calendar-alt text-blue-500 mr-3"></i>
              My Recent Events
            </h3>
            <button
              onClick={() => onNavigate?.('events')}
              className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
            >
              View All →
            </button>
          </div>

          <div className="space-y-4">
            {myEvents.slice(0, 5).map((event: any) => (
              <div
                key={event.id}
                className="p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-100 truncate pr-2">
                    {event.event_name}
                  </h4>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(event.event_date).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">
                    {event.event_participation?.length || 0} participants
                  </span>
                  <span className="text-indigo-400">
                    {event.declared_hours} hours
                  </span>
                </div>
              </div>
            ))}

            {myEvents.length === 0 && (
              <div className="text-center py-8">
                <i className="fas fa-calendar-plus text-4xl text-gray-600 mb-4"></i>
                <p className="text-gray-400 mb-4">No events created yet</p>
                <button className="button-glass-primary px-4 py-2 rounded-lg">
                  Create Your First Event
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Volunteer Hours Overview */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-100 flex items-center">
              <i className="fas fa-chart-bar text-green-500 mr-3"></i>
              Volunteer Hours Overview
            </h3>
            <button
              onClick={() => onNavigate?.('volunteers')}
              className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
            >
              View Details →
            </button>
          </div>

          <div className="space-y-4">
            {volunteerHours.map((volunteer, index) => (
              <div
                key={volunteer.volunteer_id}
                className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-100">{volunteer.volunteer_name}</p>
                    <p className="text-sm text-gray-400">{volunteer.events_count} events</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-100">{volunteer.total_hours}h</p>
                  <p className="text-xs text-gray-400">
                    {new Date(volunteer.last_activity).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}

            {volunteerHours.length === 0 && (
              <div className="text-center py-8">
                <i className="fas fa-chart-bar text-4xl text-gray-600 mb-4"></i>
                <p className="text-gray-400">No volunteer data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => onNavigate?.('events')}
          className="p-6 bg-gradient-to-r from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl hover:from-blue-600/30 hover:to-blue-800/30 transition-colors text-left"
        >
          <i className="fas fa-calendar-plus text-2xl text-blue-400 mb-3"></i>
          <h4 className="font-semibold text-gray-100 mb-2">Create New Event</h4>
          <p className="text-sm text-gray-400">Organize a new NSS activity</p>
        </button>

        <button
          onClick={() => onNavigate?.('attendance-manager')}
          className="p-6 bg-gradient-to-r from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl hover:from-green-600/30 hover:to-green-800/30 transition-colors text-left"
        >
          <i className="fas fa-user-check text-2xl text-green-400 mb-3"></i>
          <h4 className="font-semibold text-gray-100 mb-2">Mark Attendance</h4>
          <p className="text-sm text-gray-400">Record event attendance</p>
        </button>

        <button
          onClick={() => onNavigate?.('reports')}
          className="p-6 bg-gradient-to-r from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl hover:from-purple-600/30 hover:to-purple-800/30 transition-colors text-left"
        >
          <i className="fas fa-file-alt text-2xl text-purple-400 mb-3"></i>
          <h4 className="font-semibold text-gray-100 mb-2">Generate Report</h4>
          <p className="text-sm text-gray-400">Create activity reports</p>
        </button>
      </div>
    </div>
  )
}