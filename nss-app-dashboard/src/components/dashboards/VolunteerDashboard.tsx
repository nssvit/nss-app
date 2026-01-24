'use client'

/**
 * VolunteerDashboard Component
 * Uses Server Actions via useVolunteerDashboard hook (full Drizzle consistency)
 */

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useVolunteerDashboard } from '@/hooks/useVolunteerDashboard'
import { StatsCard } from '@/components/StatsCard'
import { HourRequestModal } from '@/components/HourRequestModal'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'

interface VolunteerDashboardProps {
  onNavigate?: (page: string) => void
}

export function VolunteerDashboard({ onNavigate }: VolunteerDashboardProps) {
  const { currentUser } = useAuth()
  const { stats, myParticipation, availableEvents, loading, refetch, registerForEvent } = useVolunteerDashboard()
  const { toasts, removeToast, success, error: showError, info } = useToast()

  const [showHourRequestModal, setShowHourRequestModal] = useState(false)
  const [selectedParticipation, setSelectedParticipation] = useState<any>(null)

  const handleRegisterForEvent = async (eventId: string) => {
    info('Registering for event...')
    const result = await registerForEvent(eventId)
    if (result.error) {
      showError(result.error)
    } else {
      success('Successfully registered for event!')
    }
  }

  const handleRequestHourReview = (participation: any) => {
    setSelectedParticipation({
      event_id: participation.event_id,
      event_name: participation.event_name,
      event_date: participation.event_date,
      declared_hours: participation.hours_attended,
      hours_attended: participation.hours_attended,
      approved_hours: null,
      approval_status: 'pending',
      participation_status: participation.participation_status,
      status: 'pending',
      feedback: null,
    })
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
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
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
            value={stats?.totalHours ?? 0}
            icon="fas fa-clock"
            variant="primary"
          />
          <StatsCard
            title="Events Participated"
            value={stats?.eventsParticipated ?? 0}
            icon="fas fa-calendar-check"
            variant="success"
          />
          <StatsCard
            title="Approved Hours"
            value={stats?.approvedHours ?? 0}
            icon="fas fa-check-circle"
            variant="purple"
          />
          <StatsCard
            title="Pending Reviews"
            value={stats?.pendingReviews ?? 0}
            icon="fas fa-hourglass-half"
            variant="warning"
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
              <button
                onClick={() => onNavigate?.('event-registration')}
                className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
              >
                View All →
              </button>
            </div>

            <div className="space-y-4">
              {myParticipation.slice(0, 5).map((participation) => {
                const status = participation.participation_status === 'present' ? 'approved' :
                               participation.participation_status === 'absent' ? 'rejected' : 'pending'
                return (
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
                          status === 'approved'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : status === 'rejected'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {status === 'approved' ? 'Present' :
                           status === 'rejected' ? 'Absent' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-gray-400">
                        {participation.event_date ? new Date(participation.event_date).toLocaleDateString() : 'TBD'}
                      </span>
                      <div className="flex items-center gap-2">
                        {participation.hours_attended > 0 && (
                          <span className="text-green-400">
                            {participation.hours_attended}h attended
                          </span>
                        )}
                      </div>
                    </div>

                    {status === 'pending' && participation.participation_status !== 'registered' && (
                      <button
                        onClick={() => handleRequestHourReview(participation)}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        <i className="fas fa-clock mr-1"></i>
                        Request Hour Review →
                      </button>
                    )}

                    {participation.participation_status === 'registered' && (
                      <span className="text-xs text-gray-500">
                        <i className="fas fa-info-circle mr-1"></i>
                        Awaiting attendance marking
                      </span>
                    )}
                  </div>
                )
              })}

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
              <button
                onClick={() => onNavigate?.('event-registration')}
                className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
              >
                Browse All →
              </button>
            </div>

            <div className="space-y-4">
              {availableEvents.slice(0, 6).map((event: any) => (
                <div
                  key={event.id}
                  className="p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-100 truncate pr-2">
                      {event.eventName}
                    </h4>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(event.startDate).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                    {event.description}
                  </p>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-purple-400">{event.category?.categoryName || 'General'}</span>
                      <span className="text-indigo-400">{event.declaredHours}h</span>
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
            <button
              onClick={() => onNavigate?.('profile')}
              className="w-full mt-4 p-2 bg-gray-700/50 hover:bg-gray-700/70 rounded-lg text-gray-300 hover:text-gray-100 transition-colors"
            >
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
              <button
                onClick={() => onNavigate?.('event-registration')}
                className="w-full p-3 bg-gradient-to-r from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-lg hover:from-blue-600/30 hover:to-blue-800/30 transition-colors text-left"
              >
                <i className="fas fa-calendar-plus mr-3 text-blue-400"></i>
                <span className="text-gray-100">Browse Events</span>
              </button>
              <button
                onClick={() => onNavigate?.('reports')}
                className="w-full p-3 bg-gradient-to-r from-green-600/20 to-green-800/20 border border-green-500/30 rounded-lg hover:from-green-600/30 hover:to-green-800/30 transition-colors text-left"
              >
                <i className="fas fa-file-alt mr-3 text-green-400"></i>
                <span className="text-gray-100">View My Reports</span>
              </button>
              <button
                onClick={() => onNavigate?.('profile')}
                className="w-full p-3 bg-gradient-to-r from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-lg hover:from-purple-600/30 hover:to-purple-800/30 transition-colors text-left"
              >
                <i className="fas fa-user mr-3 text-purple-400"></i>
                <span className="text-gray-100">My Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hour Request Modal */}
        <HourRequestModal
          isOpen={showHourRequestModal}
          onClose={() => {
            setShowHourRequestModal(false)
            setSelectedParticipation(null)
          }}
          participation={selectedParticipation}
          onSuccess={refetch}
        />
      </div>
    </>
  )
}
