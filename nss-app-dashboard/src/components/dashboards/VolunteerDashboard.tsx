'use client'

/**
 * VolunteerDashboard Component
 * Uses Server Actions via useVolunteerDashboard hook (full Drizzle consistency)
 */

import { useState } from 'react'
import { HourRequestModal } from '@/components/hours'
import { StatsCard, ToastContainer } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/useToast'
import { useVolunteerDashboard } from '@/hooks/useVolunteerDashboard'

interface VolunteerDashboardProps {
  onNavigate?: (page: string) => void
}

export function VolunteerDashboard({ onNavigate }: VolunteerDashboardProps) {
  const { currentUser } = useAuth()
  const { stats, myParticipation, availableEvents, loading, refetch, registerForEvent } =
    useVolunteerDashboard()
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
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500"></div>
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="main-content-bg flex-1 overflow-x-hidden overflow-y-auto p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold text-gray-100">
            Welcome back, {currentUser?.first_name}!
          </h1>
          <p className="text-gray-400">
            Track your NSS journey and discover new opportunities to contribute.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* My Participation */}
          <div className="rounded-xl border border-gray-700/30 bg-gray-800/50 p-6 backdrop-blur-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center text-lg font-semibold text-gray-100">
                <i className="fas fa-history mr-3 text-blue-500"></i>
                My Participation
              </h3>
              <button
                onClick={() => onNavigate?.('event-registration')}
                className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
              >
                View All →
              </button>
            </div>

            <div className="space-y-4">
              {myParticipation.slice(0, 5).map((participation) => {
                const status =
                  participation.participation_status === 'present'
                    ? 'approved'
                    : participation.participation_status === 'absent'
                      ? 'rejected'
                      : 'pending'
                return (
                  <div
                    key={`${participation.event_id}-${participation.event_date}`}
                    className="rounded-lg bg-gray-700/30 p-4 transition-colors hover:bg-gray-700/50"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <h4 className="truncate pr-2 font-medium text-gray-100">
                        {participation.event_name}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            status === 'approved'
                              ? 'border border-green-500/30 bg-green-500/20 text-green-400'
                              : status === 'rejected'
                                ? 'border border-red-500/30 bg-red-500/20 text-red-400'
                                : 'border border-yellow-500/30 bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {status === 'approved'
                            ? 'Present'
                            : status === 'rejected'
                              ? 'Absent'
                              : 'Pending'}
                        </span>
                      </div>
                    </div>

                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-gray-400">
                        {participation.event_date
                          ? new Date(participation.event_date).toLocaleDateString()
                          : 'TBD'}
                      </span>
                      <div className="flex items-center gap-2">
                        {participation.hours_attended > 0 && (
                          <span className="text-green-400">
                            {participation.hours_attended}h attended
                          </span>
                        )}
                      </div>
                    </div>

                    {status === 'pending' &&
                      participation.participation_status !== 'registered' && (
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
                <div className="py-8 text-center">
                  <i className="fas fa-calendar-plus mb-4 text-4xl text-gray-600"></i>
                  <p className="mb-4 text-gray-400">No events participated yet</p>
                  <p className="text-sm text-gray-500">Start by registering for events below!</p>
                </div>
              )}
            </div>
          </div>

          {/* Available Events */}
          <div className="rounded-xl border border-gray-700/30 bg-gray-800/50 p-6 backdrop-blur-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center text-lg font-semibold text-gray-100">
                <i className="fas fa-calendar-alt mr-3 text-green-500"></i>
                Available Events
              </h3>
              <button
                onClick={() => onNavigate?.('event-registration')}
                className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
              >
                Browse All →
              </button>
            </div>

            <div className="space-y-4">
              {availableEvents.slice(0, 6).map((event: any) => (
                <div
                  key={event.id}
                  className="rounded-lg bg-gray-700/30 p-4 transition-colors hover:bg-gray-700/50"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <h4 className="truncate pr-2 font-medium text-gray-100">{event.eventName}</h4>
                    <span className="text-xs whitespace-nowrap text-gray-400">
                      {new Date(event.startDate).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="mb-3 line-clamp-2 text-sm text-gray-400">{event.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-purple-400">
                        {event.category?.categoryName || 'General'}
                      </span>
                      <span className="text-indigo-400">{event.declaredHours}h</span>
                    </div>
                    <button
                      onClick={() => handleRegisterForEvent(event.id)}
                      className="rounded-lg bg-indigo-600 px-3 py-1 text-xs text-white transition-colors hover:bg-indigo-700"
                    >
                      Register
                    </button>
                  </div>
                </div>
              ))}

              {availableEvents.length === 0 && (
                <div className="py-8 text-center">
                  <i className="fas fa-calendar-check mb-4 text-4xl text-gray-600"></i>
                  <p className="text-gray-400">No new events available</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Check back later for new opportunities!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Summary & Quick Actions */}
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Profile Summary */}
          <div className="rounded-xl border border-gray-700/30 bg-gray-800/50 p-6 backdrop-blur-sm">
            <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-100">
              <i className="fas fa-user mr-3 text-indigo-500"></i>
              Profile Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Name</span>
                <span className="text-gray-100">
                  {currentUser?.first_name} {currentUser?.last_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Roll Number</span>
                <span className="text-gray-100">{currentUser?.roll_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Branch</span>
                <span className="text-gray-100">
                  {currentUser?.branch} - {currentUser?.year}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Email</span>
                <span className="truncate text-gray-100">{currentUser?.email}</span>
              </div>
            </div>
            <button
              onClick={() => onNavigate?.('profile')}
              className="mt-4 w-full rounded-lg bg-gray-700/50 p-2 text-gray-300 transition-colors hover:bg-gray-700/70 hover:text-gray-100"
            >
              <i className="fas fa-edit mr-2"></i>
              Edit Profile
            </button>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-gray-700/30 bg-gray-800/50 p-6 backdrop-blur-sm">
            <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-100">
              <i className="fas fa-bolt mr-3 text-yellow-500"></i>
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => onNavigate?.('event-registration')}
                className="w-full rounded-lg border border-blue-500/30 bg-gradient-to-r from-blue-600/20 to-blue-800/20 p-3 text-left transition-colors hover:from-blue-600/30 hover:to-blue-800/30"
              >
                <i className="fas fa-calendar-plus mr-3 text-blue-400"></i>
                <span className="text-gray-100">Browse Events</span>
              </button>
              <button
                onClick={() => onNavigate?.('reports')}
                className="w-full rounded-lg border border-green-500/30 bg-gradient-to-r from-green-600/20 to-green-800/20 p-3 text-left transition-colors hover:from-green-600/30 hover:to-green-800/30"
              >
                <i className="fas fa-file-alt mr-3 text-green-400"></i>
                <span className="text-gray-100">View My Reports</span>
              </button>
              <button
                onClick={() => onNavigate?.('profile')}
                className="w-full rounded-lg border border-purple-500/30 bg-gradient-to-r from-purple-600/20 to-purple-800/20 p-3 text-left transition-colors hover:from-purple-600/30 hover:to-purple-800/30"
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
