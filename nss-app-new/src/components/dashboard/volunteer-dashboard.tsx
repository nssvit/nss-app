'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, Clock, CheckCircle, AlertCircle, CalendarDays } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { StatsCard } from '@/components/stats-card'
import { cn } from '@/lib/utils'
import {
  EVENT_STATUS_COLORS,
  EVENT_STATUS_DISPLAY,
  APPROVAL_STATUS_COLORS,
  APPROVAL_STATUS_DISPLAY,
} from '@/lib/constants'
import type { EventStatus, ApprovalStatus } from '@/lib/constants'
import type { EventParticipationWithEvent } from '@/types'
import { getVolunteerDashboardData } from '@/app/actions/volunteers'

const CATEGORY_COLORS: Record<string, string> = {
  'Area Based - 1': '#22C55E',
  'Area Based - 2': '#16A34A',
  'University Based': '#8B5CF6',
  'College Based': '#CA8A04',
}

const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--card))',
  borderColor: 'hsl(var(--border))',
  borderRadius: '8px',
  color: 'hsl(var(--foreground))',
}

function VolunteerDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[350px] rounded-xl" />
        <Skeleton className="h-[350px] rounded-xl" />
      </div>
      <Skeleton className="h-[300px] rounded-xl" />
    </div>
  )
}

export function VolunteerDashboard() {
  const [stats, setStats] = useState<{
    totalHours: number
    approvedHours: number
    eventsParticipated: number
    pendingReviews: number
  } | null>(null)
  const [participation, setParticipation] = useState<EventParticipationWithEvent[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action returns untyped events
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getVolunteerDashboardData()
        setStats(data.stats)
        setParticipation(data.participation || [])
        setUpcomingEvents(data.availableEvents || [])
      } catch (err) {
        console.error('Failed to load volunteer dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Aggregate hours by category for donut chart
  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {}
    for (const p of participation) {
      const cat = p.categoryName || 'Other'
      grouped[cat] = (grouped[cat] || 0) + (p.approvedHours ?? p.hoursAttended ?? 0)
    }
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0)
  }, [participation])

  // Aggregate hours by month for bar chart
  const monthlyData = useMemo(() => {
    const grouped: Record<string, number> = {}
    for (const p of participation) {
      if (!p.startDate) continue
      const d = new Date(p.startDate)
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      grouped[key] = (grouped[key] || 0) + (p.approvedHours ?? p.hoursAttended ?? 0)
    }
    // Sort chronologically
    return Object.entries(grouped)
      .map(([month, hours]) => ({ month, hours }))
      .sort((a, b) => {
        const parse = (m: string) => new Date(`1 ${m}`)
        return parse(a.month).getTime() - parse(b.month).getTime()
      })
  }, [participation])

  if (loading) {
    return <VolunteerDashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Events Participated"
          value={stats?.eventsParticipated ?? 0}
          icon={Calendar}
        />
        <StatsCard title="Hours Logged" value={stats?.totalHours ?? 0} icon={Clock} />
        <StatsCard title="Approved Hours" value={stats?.approvedHours ?? 0} icon={CheckCircle} />
        <StatsCard title="Pending Reviews" value={stats?.pendingReviews ?? 0} icon={AlertCircle} />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Hours by Category - Donut */}
        <Card>
          <CardHeader>
            <CardTitle>Hours by Category</CardTitle>
            <CardDescription>Your hours across NSS categories</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-muted-foreground py-12 text-center text-sm">
                No participation data yet.
              </p>
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                      label={({ value }) => `${value}h`}
                      labelLine={false}
                    >
                      {categoryData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={CATEGORY_COLORS[entry.name] ?? '#6b7280'}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: number) => [`${value}h`, 'Hours']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Hours - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Contributions</CardTitle>
            <CardDescription>Hours you contributed each month</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <p className="text-muted-foreground py-12 text-center text-sm">
                No participation data yet.
              </p>
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      className="fill-muted-foreground"
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: number) => [`${value}h`, 'Hours']} />
                    <Bar
                      dataKey="hours"
                      name="Hours"
                      fill="hsl(var(--chart-1))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Event History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>Your latest event participation</CardDescription>
        </CardHeader>
        <CardContent>
          {participation.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No events participated yet.
            </p>
          ) : (
            <div className="max-h-[320px] space-y-2 overflow-y-auto">
              {participation.slice(0, 8).map((p) => {
                const date = p.startDate
                  ? new Date(p.startDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : ''

                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-md border px-3 py-2"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          CATEGORY_COLORS[p.categoryName ?? ''] ?? '#6b7280',
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.eventName}</p>
                      <p className="text-muted-foreground text-xs">
                        {date}
                        {p.categoryName ? ` · ${p.categoryName}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        {p.approvedHours ?? p.hoursAttended}h
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'border-none text-[10px]',
                          APPROVAL_STATUS_COLORS[p.approvalStatus as ApprovalStatus] ?? ''
                        )}
                      >
                        {APPROVAL_STATUS_DISPLAY[p.approvalStatus as ApprovalStatus] ??
                          p.approvalStatus}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Events you can register for or attend</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No upcoming events at the moment.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => {
                const eventStatus = event.eventStatus || event.event_status || ''
                const statusColors = EVENT_STATUS_COLORS[eventStatus as EventStatus] ?? ''
                const statusLabel = EVENT_STATUS_DISPLAY[eventStatus as EventStatus] ?? eventStatus
                const eventDate = event.startDate || event.start_date
                const eventName = event.eventName || event.event_name
                const declaredHours = event.declaredHours || event.declared_hours || 0

                return (
                  <div
                    key={event.id}
                    className="bg-muted/50 flex items-center justify-between rounded-lg p-3"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate text-sm font-medium">{eventName}</p>
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <CalendarDays className="h-3 w-3" />
                        {eventDate
                          ? new Date(eventDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'TBD'}
                        <span className="text-muted-foreground/50">|</span>
                        {declaredHours}h credits
                      </div>
                    </div>
                    <Badge variant="secondary" className={cn('text-[10px]', statusColors)}>
                      {statusLabel}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
