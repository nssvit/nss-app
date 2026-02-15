'use client'

import { useMemo, useState } from 'react'
import { Calendar, MapPin, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useEvents } from '@/hooks/use-events'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'
import { EventStatusBadge } from './event-status-badge'
import { EVENT_STATUS } from '@/lib/constants'
import { registerForEvent } from '@/app/actions/events'

export function EventRegistration() {
  const { events, loading, refresh } = useEvents()
  const [registering, setRegistering] = useState<string | null>(null)
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set())

  const openEvents = useMemo(() => {
    return events.filter((e) => e.eventStatus === EVENT_STATUS.REGISTRATION_OPEN)
  }, [events])

  async function handleRegister(eventId: string) {
    setRegistering(eventId)
    try {
      await registerForEvent(eventId)
      setRegisteredIds((prev) => new Set(prev).add(eventId))
      toast.success('Registered successfully!')
      refresh()
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to register'
      if (msg.includes('Already registered')) {
        toast.info('You are already registered for this event')
        setRegisteredIds((prev) => new Set(prev).add(eventId))
      } else {
        toast.error(msg)
      }
      console.error('Failed to register:', err)
    } finally {
      setRegistering(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Event Registration" description="Register for upcoming events." />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Event Registration" description="Register for upcoming events." />
      {openEvents.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No open registrations"
          description="There are currently no events accepting registrations. Check back later."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {openEvents.map((event) => {
            const formattedDate = event.startDate
              ? new Date(event.startDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'TBD'

            const alreadyRegistered = registeredIds.has(event.id)

            return (
              <Card key={event.id} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-1 text-base">{event.eventName}</CardTitle>
                    <EventStatusBadge status={event.eventStatus} />
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>{formattedDate}</span>
                  </div>
                  {event.location && (
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>{event.declaredHours}h credits</span>
                  </div>
                  <Button
                    className="mt-1 w-full"
                    onClick={() => handleRegister(event.id)}
                    disabled={registering === event.id || alreadyRegistered}
                    variant={alreadyRegistered ? 'secondary' : 'default'}
                  >
                    {registering === event.id
                      ? 'Registering...'
                      : alreadyRegistered
                        ? 'Registered'
                        : 'Register'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
