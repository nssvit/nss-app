'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { StatsCard } from '@/components/StatsCard'

interface VolunteerStats {
  totalHours: number
  eventsParticipated: number
  pendingReviews: number
  approvedHours: number
}

interface MyEventParticipation {
  event_id: string
  event_name: string
  event_date: string
  declared_hours: number
  approved_hours: number | null
  status: 'pending' | 'approved' | 'rejected'
  feedback: string | null
}

interface AvailableEvent {
  id: string
  event_name: string
  event_date: string
  event_description: string
  declared_hours: number
  category_name: string
  registration_deadline: string
  is_registered: boolean
}

export function VolunteerDashboard() {
  const { currentUser } = useAuth()
  const [stats, setStats] = useState<VolunteerStats>({
    totalHours: 0,
    eventsParticipated: 0,
    pendingReviews: 0,
    approvedHours: 0
  })
  const [myParticipation, setMyParticipation] = useState<MyEventParticipation[]>([])
  const [availableEvents, setAvailableEvents] = useState<AvailableEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showHourRequestModal, setShowHourRequestModal] = useState(false)
  const [selectedParticipation, setSelectedParticipation] = useState<MyEventParticipation | null>(null)

  useEffect(() => {
    loadVolunteerDashboardData()
  }, [currentUser])

  const loadVolunteerDashboardData = async () => {
    if (!currentUser?.volunteer_id) return

    try {
      // Load my event participation
      const { data: participationData } = await supabase
        .from('event_participation')
        .select(`
          *,
          events (
            event_name,
            event_date,
            declared_hours,
            event_categories (category_name)
          )
        `)
        .eq('volunteer_id', currentUser.volunteer_id)
        .order('created_at', { ascending: false })

      const myParticipationFormatted = participationData?.map(p => ({
        event_id: p.event_id,
        event_name: p.events?.event_name || 'Unknown Event',
        event_date: p.events?.event_date || '',
        declared_hours: p.declared_hours || 0,
        approved_hours: p.approved_hours,
        status: p.approved_hours !== null ? 'approved' : 'pending' as 'pending' | 'approved' | 'rejected',
        feedback: p.feedback
      })) || []

      setMyParticipation(myParticipationFormatted)

      // Calculate statistics
      const totalHours = myParticipationFormatted.reduce((sum, p) => sum + p.declared_hours, 0)
      const approvedHours = myParticipationFormatted.reduce((sum, p) => sum + (p.approved_hours || 0), 0)
      const pendingReviews = myParticipationFormatted.filter(p => p.status === 'pending').length

      setStats({
        totalHours,
        eventsParticipated: myParticipationFormatted.length,
        pendingReviews,
        approvedHours
      })

      // Load available events (not yet registered for)
      const { data: allEvents } = await supabase
        .from('events')
        .select(`
          id,
          event_name,
          event_date,
          event_description,
          declared_hours,
          registration_deadline,
          is_active,
          event_categories (category_name)
        `)
        .eq('is_active', true)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })

      const registeredEventIds = myParticipationFormatted.map(p => p.event_id)
      const availableEventsFormatted = allEvents?.filter(event =>
        !registeredEventIds.includes(event.id)
      ).map(event => ({
        id: event.id,
        event_name: event.event_name,
        event_date: event.event_date,
        event_description: event.event_description,
        declared_hours: event.declared_hours,
        category_name: event.event_categories?.category_name || 'General',
        registration_deadline: event.registration_deadline || event.event_date,
        is_registered: false
      })) || []

      setAvailableEvents(availableEventsFormatted.slice(0, 6))

    } catch (error) {
      console.error('Error loading volunteer dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterForEvent = async (eventId: string) => {
    if (!currentUser?.volunteer_id) return

    try {
      const { error } = await supabase
        .from('event_participation')
        .insert({
          event_id: eventId,
          volunteer_id: currentUser.volunteer_id,
          declared_hours: 0 // Will be updated later
        })

      if (error) throw error

      // Refresh data
      loadVolunteerDashboardData()
    } catch (error) {
      console.error('Error registering for event:', error)
    }
  }

  const handleRequestHourReview = (participation: MyEventParticipation) => {
    setSelectedParticipation(participation)
    setShowHourRequestModal(true)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your dashboard...</p>
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
          Track your NSS journey and discover new opportunities to contribute.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Hours"
          value={stats.totalHours}
          icon="fas fa-clock"
          color="blue"
        />
        <StatsCard
          title="Events Participated"
          value={stats.eventsParticipated}
          icon="fas fa-calendar-check"
          color="green"
        />
        <StatsCard
          title="Approved Hours"
          value={stats.approvedHours}
          icon="fas fa-check-circle"
          color="purple"
        />
        <StatsCard
          title="Pending Reviews"
          value={stats.pendingReviews}
          icon="fas fa-hourglass-half"
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Participation */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-100 flex items-center">
              <i className="fas fa-history text-blue-500 mr-3"></i>
              My Participation
            </h3>
            <button className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
              View All →
            </button>
          </div>

          <div className="space-y-4">
            {myParticipation.slice(0, 5).map((participation) => (
              <div
                key={`${participation.event_id}-${participation.event_date}`}
                className="p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-100 truncate pr-2">
                    {participation.event_name}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      participation.status === 'approved'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : participation.status === 'rejected'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {participation.status === 'approved' ? 'Approved' :
                       participation.status === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-gray-400">
                    {new Date(participation.event_date).toLocaleDateString()}
                  </span>
                  <span className="text-indigo-400">
                    {participation.declared_hours} hours declared
                  </span>
                </div>

                {participation.status === 'pending' && (
                  <button
                    onClick={() => handleRequestHourReview(participation)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Request Hour Review →
                  </button>
                )}

                {participation.feedback && (
                  <p className="text-xs text-gray-400 mt-2 italic">
                    Feedback: {participation.feedback}
                  </p>
                )}
              </div>
            ))}

            {myParticipation.length === 0 && (
              <div className="text-center py-8">
                <i className="fas fa-calendar-plus text-4xl text-gray-600 mb-4"></i>
                <p className="text-gray-400 mb-4">No events participated yet</p>
                <p className="text-sm text-gray-500">Start by registering for events below!</p>
              </div>
            )}
          </div>
        </div>

        {/* Available Events */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-100 flex items-center">
              <i className="fas fa-calendar-alt text-green-500 mr-3"></i>
              Available Events
            </h3>
            <button className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
              Browse All →
            </button>
          </div>

          <div className="space-y-4">
            {availableEvents.map((event) => (
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

                <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                  {event.event_description}
                </p>

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-purple-400">{event.category_name}</span>
                    <span className="text-indigo-400">{event.declared_hours}h</span>
                  </div>
                  <button
                    onClick={() => handleRegisterForEvent(event.id)}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition-colors"
                  >
                    Register
                  </button>
                </div>
              </div>
            ))}

            {availableEvents.length === 0 && (
              <div className="text-center py-8">
                <i className="fas fa-calendar-check text-4xl text-gray-600 mb-4"></i>
                <p className="text-gray-400">No new events available</p>
                <p className="text-sm text-gray-500 mt-2">Check back later for new opportunities!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Summary & Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Summary */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
            <i className="fas fa-user text-indigo-500 mr-3"></i>
            Profile Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Name</span>
              <span className="text-gray-100">{currentUser?.first_name} {currentUser?.last_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Roll Number</span>
              <span className="text-gray-100">{currentUser?.roll_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Branch</span>
              <span className="text-gray-100">{currentUser?.branch} - {currentUser?.year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Email</span>
              <span className="text-gray-100 truncate">{currentUser?.email}</span>
            </div>
          </div>
          <button className="w-full mt-4 p-2 bg-gray-700/50 hover:bg-gray-700/70 rounded-lg text-gray-300 hover:text-gray-100 transition-colors">
            <i className="fas fa-edit mr-2"></i>
            Edit Profile
          </button>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
            <i className="fas fa-bolt text-yellow-500 mr-3"></i>
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full p-3 bg-gradient-to-r from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-lg hover:from-blue-600/30 hover:to-blue-800/30 transition-colors text-left">
              <i className="fas fa-calendar-plus mr-3 text-blue-400"></i>
              <span className="text-gray-100">Browse Events</span>
            </button>
            <button className="w-full p-3 bg-gradient-to-r from-green-600/20 to-green-800/20 border border-green-500/30 rounded-lg hover:from-green-600/30 hover:to-green-800/30 transition-colors text-left">
              <i className="fas fa-file-alt mr-3 text-green-400"></i>
              <span className="text-gray-100">View Certificates</span>
            </button>
            <button className="w-full p-3 bg-gradient-to-r from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-lg hover:from-purple-600/30 hover:to-purple-800/30 transition-colors text-left">
              <i className="fas fa-download mr-3 text-purple-400"></i>
              <span className="text-gray-100">Download Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}