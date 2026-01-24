"use client";

import { useEffect } from "react";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useDashboardCache } from "@/contexts/DashboardCacheContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StatsCard } from "./StatsCard";
import { getStatusBadgeClass } from "@/utils/styles/badges";
import { Skeleton } from "./Skeleton";
import { ErrorState } from "./ErrorState";

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
  onCreateEvent?: () => void;
}

export function DashboardPage({
  onNavigate,
  onCreateEvent,
}: DashboardPageProps) {
  const layout = useResponsiveLayout();
  const { cache, fetchDashboardData } = useDashboardCache();

  // Fetch data only if cache is invalid or empty
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const stats = cache.stats || {
    total_events: 0,
    active_volunteers: 0,
    total_hours: 0,
    ongoing_projects: 0,
  };

  // Transform stats for display
  const displayStats = [
    {
      title: "Total Events",
      value: stats.total_events.toLocaleString(),
      change: "+12%",
      changeType: "increase" as const,
      icon: "fas fa-calendar-check",
      variant: "purple" as const,
    },
    {
      title: "Active Volunteers",
      value: stats.active_volunteers.toLocaleString(),
      change: "+5%",
      changeType: "increase" as const,
      icon: "fas fa-users",
      variant: "success" as const,
    },
    {
      title: "Community Hours",
      value: stats.total_hours.toLocaleString(),
      change: "+18%",
      changeType: "increase" as const,
      icon: "fas fa-clock",
      variant: "primary" as const,
    },
    {
      title: "Ongoing Projects",
      value: stats.ongoing_projects.toLocaleString(),
      change: "0%",
      changeType: "neutral" as const,
      icon: "fas fa-project-diagram",
      variant: "orange" as const,
    },
  ];

  // Transform activity data for chart
  const chartData = cache.activityData.map((item) => ({
    month: item.month,
    events: Number(item.events_count),
    volunteers: Number(item.volunteers_count),
    hours: Number(item.hours_sum),
  }));

  // Transform recent events for display
  const formattedRecentEvents = cache.recentEvents.map((event) => ({
    title: event.name,
    date: event.event_date
      ? new Date(event.event_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : new Date(event.start_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
    participants: 0,
    status:
      event.event_status === "completed"
        ? "Completed"
        : event.event_status === "ongoing"
          ? "Ongoing"
          : "Upcoming",
  }));

  // Show error state
  if (cache.error && !cache.loading) {
    return (
      <div
        className={`flex-1 overflow-x-hidden overflow-y-auto main-content-bg mobile-scroll safe-area-bottom ${layout.getContentPadding()}`}
      >
        <ErrorState error={cache.error} retry={() => fetchDashboardData(true)} />
      </div>
    );
  }

  return (
    <div
      className={`flex-1 overflow-x-hidden overflow-y-auto main-content-bg mobile-scroll safe-area-bottom ${layout.getContentPadding()}`}
    >
      {/* Welcome Section */}
      <div className="mb-6">
        <h2 className="text-heading-2 mb-2">Welcome back, Admin!</h2>
        <p className="text-body">
          Here&apos;s what&apos;s happening with your NSS activities today.
        </p>
      </div>

      {/* Stats Grid */}
      <div
        className={`grid ${layout.isMobile ? "grid-cols-1" : layout.isTablet ? "grid-cols-2" : "grid-cols-4"} gap-4 mb-6`}
      >
        {cache.loading ? (
          <>
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </>
        ) : (
          displayStats.map((stat, index) => (
            <div key={index} className="h-full">
              <StatsCard
                title={stat.title}
                value={stat.value}
                change={{ value: parseInt(stat.change), type: stat.changeType }}
                icon={stat.icon}
                variant={stat.variant}
              />
            </div>
          ))
        )}
      </div>

      {/* Two Column Layout */}
      <div
        className={`grid ${layout.isMobile ? "grid-cols-1" : "grid-cols-2"} gap-6`}
      >
        {/* Recent Events */}
        <div className="card-glass rounded-xl p-5 h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-heading-3">Recent Events</h3>
            <button
              onClick={() => onNavigate?.("events")}
              className="btn btn-sm btn-ghost"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {cache.loading ? (
              <>
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </>
            ) : formattedRecentEvents.length > 0 ? (
              formattedRecentEvents.map((event, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-800/30 hover:bg-black/60 transition-colors rounded-lg group"
                >
                  <div className="flex-1">
                    <h4
                      className="text-body-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {event.title}
                    </h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-caption">{event.date}</span>
                      <span className="text-caption">
                        {event.participants} participants
                      </span>
                    </div>
                  </div>
                  <span className={getStatusBadgeClass(event.status)}>
                    {event.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-caption text-center py-4">No recent events</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card-glass rounded-xl p-5 h-full">
          <h3 className="text-heading-3 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onCreateEvent?.()}
              className="btn btn-secondary hover-lift flex flex-col items-center space-y-2 p-4"
            >
              <i
                className="fas fa-plus text-lg"
                style={{ color: "var(--brand-primary)" }}
              ></i>
              <span className="text-sm font-medium">Create Event</span>
            </button>
            <button
              onClick={() => onNavigate?.("volunteers")}
              className="btn btn-secondary hover-lift flex flex-col items-center space-y-2 p-4"
            >
              <i
                className="fas fa-user-plus text-lg"
                style={{ color: "var(--status-success-text)" }}
              ></i>
              <span className="text-sm font-medium">Add Volunteer</span>
            </button>
            <button
              onClick={() => onNavigate?.("reports")}
              className="btn btn-secondary hover-lift flex flex-col items-center space-y-2 p-4"
            >
              <i className="fas fa-chart-line text-lg text-purple-400"></i>
              <span className="text-sm font-medium">View Reports</span>
            </button>
            <button
              onClick={() => onCreateEvent?.()}
              className="btn btn-secondary hover-lift flex flex-col items-center space-y-2 p-4"
            >
              <i className="fas fa-calendar-alt text-lg text-orange-400"></i>
              <span className="text-sm font-medium">Schedule Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Activity Chart Section */}
      <div className="card-glass rounded-xl p-5 mt-6">
        <h3 className="text-heading-3 mb-4">Activity Overview</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id="colorVolunteers"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="var(--chart-text)"
                tick={{ fill: "var(--chart-text)" }}
                axisLine={{ stroke: "var(--chart-grid)" }}
                tickLine={false}
              />
              <YAxis
                stroke="var(--chart-text)"
                tick={{ fill: "var(--chart-text)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[var(--bg-surface)] backdrop-blur-md border border-[var(--border-medium)] rounded-lg p-3 shadow-xl">
                        <p className="text-[var(--text-primary)] font-medium mb-2">{label}</p>
                        {payload.map((entry: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor:
                                  entry.color === "url(#colorEvents)"
                                    ? "var(--chart-1)"
                                    : "var(--chart-2)",
                              }}
                            />
                            <span className="text-[var(--text-secondary)] capitalize">
                              {entry.name}:
                            </span>
                            <span className="text-[var(--text-primary)] font-semibold">
                              {entry.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="events"
                stroke="var(--chart-1)"
                fillOpacity={1}
                fill="url(#colorEvents)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="volunteers"
                stroke="var(--chart-2)"
                fillOpacity={1}
                fill="url(#colorVolunteers)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
