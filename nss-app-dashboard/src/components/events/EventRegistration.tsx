'use client'

/**
 * EventRegistration Component
 * Uses Server Actions via useEventRegistration hook (full Drizzle consistency)
 */

import { useState } from 'react'
import { ToastContainer } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useEventRegistration, type RegistrableEvent } from '@/hooks/useEventRegistration'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { useToast } from '@/hooks/useToast'

export function EventRegistration() {
  const layout = useResponsiveLayout()
  const { currentUser } = useAuth()
  const { toasts, removeToast, success, error: showError, info } = useToast()
  const { events: allEvents, loading, refetch, registerForEvent } = useEventRegistration()

  const [filter, setFilter] = useState<'all' | 'upcoming' | 'registered'>('upcoming')

  // Apply filter to events
  const events = allEvents.filter((event) => {
    if (filter === 'upcoming') {
      const now = new Date()
      return new Date(event.start_date) >= now
    } else if (filter === 'registered') {
      return event.is_registered
    }
    return true
  })

  const handleRegisterForEvent = async (eventId: string) => {
    if (!currentUser) {
      showError('Please login to register')
      return
    }

    info('Registering for event...')
    const result = await registerForEvent(eventId)

    if (result.error) {
      if (result.error.includes('already')) {
        showError('You are already registered for this event')
      } else {
        showError(result.error)
      }
    } else {
      success('Successfully registered for event!')
    }
  }

  const handleUnregisterFromEvent = async (eventId: string) => {
    if (!currentUser) return

    if (!confirm('Are you sure you want to unregister from this event?')) {
      return
    }

    info('Unregistering from event...')
    // Note: For now, show a message that this is coming soon
    showError('Unregistration via dashboard coming soon. Please contact admin.')
  }

  const canRegister = (event: RegistrableEvent): { can: boolean; reason?: string } => {
    // Check registration deadline
    if (event.registration_deadline) {
      const deadline = new Date(event.registration_deadline)
      if (new Date() > deadline) {
        return { can: false, reason: 'Registration deadline passed' }
      }
    }

    // Check if event is full
    if (event.max_participants && event.participant_count >= event.max_participants) {
      return { can: false, reason: 'Event is full' }
    }

    // Check event status
    if (event.event_status === 'completed' || event.event_status === 'cancelled') {
      return { can: false, reason: 'Event is not open for registration' }
    }

    return { can: true }
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div
        className={`main-content-bg mobile-scroll safe-area-bottom flex-1 overflow-x-hidden overflow-y-auto ${layout.getContentPadding()}`}
      >
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-heading-2 mb-4">Event Registration</h2>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('upcoming')}
              className={`btn btn-sm ${filter === 'upcoming' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Upcoming Events
            </button>
            <button
              onClick={() => setFilter('registered')}
              className={`btn btn-sm ${filter === 'registered' ? 'btn-primary' : 'btn-secondary'}`}
            >
              My Registrations
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            >
              All Events
            </button>
          </div>
        </div>

        {/* Events List */}
        <div className="mt-6">
          {loading ? (
            <div className="card-glass rounded-xl p-8 text-center">
              <i className="fas fa-spinner fa-spin mb-4 text-3xl text-gray-400"></i>
              <p className="text-gray-400">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="card-glass rounded-xl p-8 text-center">
              <i className="fas fa-calendar-times mb-4 text-4xl text-gray-400"></i>
              <h3 className="text-heading-3 mb-2">No Events Found</h3>
              <p className="text-body">
                {filter === 'registered'
                  ? 'You have not registered for any events yet'
                  : 'No events available'}
              </p>
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 ${layout.isTablet ? 'md:grid-cols-2' : 'lg:grid-cols-2'} gap-4 md:gap-6`}
            >
              {events.map((event) => {
                const registration = canRegister(event)
                const isUpcoming = new Date(event.start_date) > new Date()

                return (
                  <div key={event.id} className="card-glass overflow-hidden rounded-xl">
                    <div className="p-6">
                      {/* Header */}
                      <div className="mb-4 flex items-start justify-between">
                        <h3 className="text-heading-3 flex-1">{event.name}</h3>
                        {event.category_name && (
                          <span
                            className="rounded-full px-3 py-1 text-xs font-medium"
                            style={{
                              backgroundColor: `${event.color_hex || '#6366F1'}20`,
                              color: event.color_hex || '#6366F1',
                            }}
                          >
                            {event.category_name}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {event.description && (
                        <p className="text-body mb-4 line-clamp-2 text-sm">{event.description}</p>
                      )}

                      {/* Details */}
                      <div className="mb-4 space-y-2 text-sm">
                        <div className="flex items-center text-gray-400">
                          <i className="fas fa-calendar w-5"></i>
                          <span>{new Date(event.start_date).toLocaleDateString()}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center text-gray-400">
                            <i className="fas fa-map-marker-alt w-5"></i>
                            <span>{event.location}</span>
                          </div>
                        )}
                        <div className="flex items-center text-gray-400">
                          <i className="fas fa-clock w-5"></i>
                          <span>{event.declared_hours} hours</span>
                        </div>
                        <div className="flex items-center text-gray-400">
                          <i className="fas fa-users w-5"></i>
                          <span>
                            {event.participant_count || 0}
                            {event.max_participants && ` / ${event.max_participants}`} registered
                          </span>
                        </div>
                        {event.registration_deadline && (
                          <div className="flex items-center text-yellow-400">
                            <i className="fas fa-exclamation-triangle w-5"></i>
                            <span>
                              Deadline: {new Date(event.registration_deadline).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="mb-4">
                        <span
                          className={`badge ${
                            event.event_status === 'ongoing'
                              ? 'badge-info'
                              : event.event_status === 'completed'
                                ? 'badge-success'
                                : event.event_status === 'cancelled'
                                  ? 'badge-error'
                                  : 'badge-warning'
                          }`}
                        >
                          {event.event_status}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {event.is_registered ? (
                          <>
                            <button className="btn btn-sm btn-success flex-1" disabled>
                              <i className="fas fa-check mr-2"></i>
                              Registered
                            </button>
                            {isUpcoming && event.event_status === 'planned' && (
                              <button
                                onClick={() => handleUnregisterFromEvent(event.id)}
                                className="btn btn-sm btn-danger"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            )}
                          </>
                        ) : registration.can ? (
                          <button
                            onClick={() => handleRegisterForEvent(event.id)}
                            className="btn btn-sm btn-primary w-full"
                          >
                            <i className="fas fa-user-plus mr-2"></i>
                            Register
                          </button>
                        ) : (
                          <button className="btn btn-sm btn-secondary w-full" disabled>
                            {registration.reason}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
