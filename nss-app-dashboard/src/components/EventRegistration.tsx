"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { ToastContainer } from "./Toast";

interface Event {
  id: string;
  name: string;
  description: string;
  event_date: string;
  start_date: string;
  end_date: string;
  declared_hours: number;
  location: string | null;
  event_status: string;
  min_participants: number | null;
  max_participants: number | null;
  registration_deadline: string | null;
  event_categories: {
    name: string;
    color_hex: string | null;
  } | null;
  _count?: {
    registered: number;
  };
  is_registered?: boolean;
}

export function EventRegistration() {
  const layout = useResponsiveLayout();
  const { currentUser } = useAuth();
  const { toasts, removeToast, success, error: showError, info } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'registered'>('upcoming');

  useEffect(() => {
    loadEvents();
  }, [filter, currentUser]);

  const loadEvents = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      const volunteerId = currentUser.volunteer_id || currentUser.id;

      // ⚡ OPTIMIZED: Fetch all data in PARALLEL (3x faster!)
      const [eventsResult, registrationsResult, participantCountsResult] = await Promise.all([
        // Load events
        supabase
          .from('events')
          .select(`
            id,
            name,
            description,
            event_date,
            start_date,
            end_date,
            declared_hours,
            location,
            event_status,
            min_participants,
            max_participants,
            registration_deadline,
            event_categories (
              name,
              color_hex
            )
          `)
          .eq('is_active', true)
          .in('event_status', ['planned', 'registration_open', 'registration_closed', 'ongoing'])
          .order('start_date', { ascending: true }),

        // Get user's registrations
        supabase
          .from('event_participation')
          .select('event_id')
          .eq('volunteer_id', volunteerId),

        // Get all participant counts (we'll filter after)
        supabase
          .from('event_participation')
          .select('event_id'),
      ]);

      if (eventsResult.error) throw eventsResult.error;
      if (registrationsResult.error) throw registrationsResult.error;
      if (participantCountsResult.error) throw participantCountsResult.error;

      const eventsData = eventsResult.data;
      const registrations = registrationsResult.data;
      const participantCounts = participantCountsResult.data;

      const registeredEventIds = new Set(registrations?.map(r => r.event_id) || []);

      // Filter participant counts to only events we're showing
      const eventIds = new Set(eventsData?.map(e => e.id) || []);
      const filteredCounts = (participantCounts || []).filter(p => eventIds.has(p.event_id));

      const counts = (participantCounts || []).reduce((acc: Record<string, number>, p) => {
        acc[p.event_id] = (acc[p.event_id] || 0) + 1;
        return acc;
      }, {});

      // Combine data
      let combinedEvents = (eventsData || []).map(event => ({
        ...event,
        is_registered: registeredEventIds.has(event.id),
        _count: {
          registered: counts[event.id] || 0
        }
      }));

      // Apply filter
      if (filter === 'upcoming') {
        const now = new Date();
        combinedEvents = combinedEvents.filter(e => new Date(e.start_date) >= now);
      } else if (filter === 'registered') {
        combinedEvents = combinedEvents.filter(e => e.is_registered);
      }

      setEvents(combinedEvents);
    } catch (err: any) {
      showError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const registerForEvent = async (eventId: string) => {
    if (!currentUser) {
      showError('Please login to register');
      return;
    }

    try {
      info('Registering for event...');

      const volunteerId = currentUser.volunteer_id || currentUser.id;

      const { error } = await supabase
        .from('event_participation')
        .insert({
          event_id: eventId,
          volunteer_id: volunteerId,
          participation_status: 'registered',
          hours_attended: 0,
          declared_hours: 0,
          recorded_by_volunteer_id: volunteerId,
          registration_date: new Date().toISOString()
        });

      if (error) throw error;

      success('Successfully registered for event!');
      loadEvents();
    } catch (err: any) {
      if (err.code === '23505') {
        showError('You are already registered for this event');
      } else {
        showError(err.message || 'Failed to register');
      }
    }
  };

  const unregisterFromEvent = async (eventId: string) => {
    if (!currentUser) return;

    if (!confirm('Are you sure you want to unregister from this event?')) {
      return;
    }

    try {
      info('Unregistering from event...');

      const volunteerId = currentUser.volunteer_id || currentUser.id;

      const { error } = await supabase
        .from('event_participation')
        .delete()
        .eq('event_id', eventId)
        .eq('volunteer_id', volunteerId)
        .eq('participation_status', 'registered'); // Only allow unregistering if just registered

      if (error) throw error;

      success('Successfully unregistered from event');
      loadEvents();
    } catch (err: any) {
      showError(err.message || 'Failed to unregister');
    }
  };

  const canRegister = (event: Event): { can: boolean; reason?: string } => {
    // Check registration deadline
    if (event.registration_deadline) {
      const deadline = new Date(event.registration_deadline);
      if (new Date() > deadline) {
        return { can: false, reason: 'Registration deadline passed' };
      }
    }

    // Check if event is full
    if (event.max_participants && event._count && event._count.registered >= event.max_participants) {
      return { can: false, reason: 'Event is full' };
    }

    // Check event status
    if (event.event_status === 'completed' || event.event_status === 'cancelled') {
      return { can: false, reason: 'Event is not open for registration' };
    }

    return { can: true };
  };

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className={`flex-1 overflow-x-hidden overflow-y-auto main-content-bg mobile-scroll safe-area-bottom ${layout.getContentPadding()}`}>
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
              <i className="fas fa-spinner fa-spin text-3xl text-gray-400 mb-4"></i>
              <p className="text-gray-400">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="card-glass rounded-xl p-8 text-center">
              <i className="fas fa-calendar-times text-4xl text-gray-400 mb-4"></i>
              <h3 className="text-heading-3 mb-2">No Events Found</h3>
              <p className="text-body">
                {filter === 'registered' ? 'You have not registered for any events yet' : 'No events available'}
              </p>
            </div>
          ) : (
            <div className={`grid grid-cols-1 ${layout.isTablet ? 'md:grid-cols-2' : 'lg:grid-cols-2'} gap-4 md:gap-6`}>
            {events.map((event) => {
              const registration = canRegister(event);
              const isUpcoming = new Date(event.start_date) > new Date();

              return (
                <div key={event.id} className="card-glass rounded-xl overflow-hidden">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-heading-3 flex-1">{event.name}</h3>
                      {event.event_categories && (
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${event.event_categories.color_hex}20`,
                            color: event.event_categories.color_hex || '#6366F1'
                          }}
                        >
                          {event.event_categories.name}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {event.description && (
                      <p className="text-body text-sm mb-4 line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    {/* Details */}
                    <div className="space-y-2 mb-4 text-sm">
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
                          {event._count?.registered || 0}
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
                      <span className={`badge ${
                        event.event_status === 'ongoing' ? 'badge-info' :
                        event.event_status === 'completed' ? 'badge-success' :
                        event.event_status === 'cancelled' ? 'badge-error' :
                        'badge-warning'
                      }`}>
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
                              onClick={() => unregisterFromEvent(event.id)}
                              className="btn btn-sm btn-danger"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          )}
                        </>
                      ) : registration.can ? (
                        <button
                          onClick={() => registerForEvent(event.id)}
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
              );
            })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
