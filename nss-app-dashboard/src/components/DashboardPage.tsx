"use client";

import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
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

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
  onCreateEvent?: () => void;
}

export function DashboardPage({
  onNavigate,
  onCreateEvent,
}: DashboardPageProps) {
  const layout = useResponsiveLayout();

  // Activity chart data
  const activityData = [
    { month: "Jan", events: 18, volunteers: 145, hours: 720 },
    { month: "Feb", events: 22, volunteers: 167, hours: 890 },
    { month: "Mar", events: 25, volunteers: 189, hours: 1050 },
    { month: "Apr", events: 28, volunteers: 203, hours: 1200 },
    { month: "May", events: 24, volunteers: 198, hours: 1100 },
    { month: "Jun", events: 31, volunteers: 234, hours: 1350 },
    { month: "Jul", events: 29, volunteers: 221, hours: 1280 },
    { month: "Aug", events: 26, volunteers: 208, hours: 1180 },
    { month: "Sep", events: 33, volunteers: 245, hours: 1420 },
    { month: "Oct", events: 35, volunteers: 267, hours: 1580 },
    { month: "Nov", events: 32, volunteers: 251, hours: 1450 },
    { month: "Dec", events: 27, volunteers: 223, hours: 1320 },
  ];

  const stats = [
    {
      title: "Total Events",
      value: "248",
      change: "+12%",
      changeType: "increase" as const,
      icon: "fas fa-calendar-check",
      color: "text-blue-400",
    },
    {
      title: "Active Volunteers",
      value: "1,847",
      change: "+5%",
      changeType: "increase" as const,
      icon: "fas fa-users",
      color: "text-green-400",
    },
    {
      title: "Community Hours",
      value: "12,486",
      change: "+18%",
      changeType: "increase" as const,
      icon: "fas fa-clock",
      color: "text-purple-400",
    },
    {
      title: "Ongoing Projects",
      value: "23",
      change: "-2%",
      changeType: "decrease" as const,
      icon: "fas fa-project-diagram",
      color: "text-orange-400",
    },
  ];

  const recentEvents = [
    {
      title: "Beach Clean-Up Drive",
      date: "Aug 15",
      participants: 73,
      status: "Completed",
    },
    {
      title: "Blood Donation VIT",
      date: "Sep 10",
      participants: 118,
      status: "Completed",
    },
    {
      title: "Digital Literacy Workshop",
      date: "Dec 5",
      participants: 32,
      status: "Upcoming",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "text-green-400";
      case "Upcoming":
        return "text-blue-400";
      case "Ongoing":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div
      className={`flex-1 overflow-x-hidden overflow-y-auto main-content-bg mobile-scroll safe-area-bottom ${layout.getContentPadding()}`}
    >
      {/* Welcome Section */}
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-100 mb-2">
          Welcome back, Admin!
        </h2>
        <p className="text-gray-300">
          Here&apos;s what&apos;s happening with your NSS activities today.
        </p>
      </div>

      {/* Stats Grid */}
      <div
        className={`grid ${layout.isMobile ? "grid-cols-1" : layout.isTablet ? "grid-cols-2" : "grid-cols-4"} gap-4 mb-6`}
      >
        {stats.map((stat, index) => (
          <div key={index} className="h-full">
            <StatsCard
              title={stat.title}
              value={stat.value}
              change={{ value: parseInt(stat.change), type: stat.changeType }}
              icon={stat.icon}
              color={stat.color.replace('text-', '').replace('-400', '') as any}
            />
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div
        className={`grid ${layout.isMobile ? "grid-cols-1" : "grid-cols-2"} gap-6`}
      >
        {/* Recent Events */}
        <div className="card-glass rounded-xl p-5 h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-100">
              Recent Events
            </h3>
            <button
              onClick={() => onNavigate?.("events")}
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentEvents.map((event, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-800/30 hover:bg-black/60 transition-colors rounded-lg group"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-200 group-hover:text-white transition-colors text-sm">
                    {event.title}
                  </h4>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">{event.date}</span>
                    <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                      {event.participants} participants
                    </span>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium ${getStatusColor(event.status)}`}
                >
                  {event.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card-glass rounded-xl p-5 h-full">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onCreateEvent?.()}
              className="pwa-button button-glass-primary hover-lift flex flex-col items-center space-y-2 p-4 rounded-lg focus-visible"
            >
              <i className="fas fa-plus text-lg text-indigo-400"></i>
              <span className="text-sm font-medium">Create Event</span>
            </button>
            <button
              onClick={() => onNavigate?.("volunteers")}
              className="pwa-button button-glass-secondary hover-lift flex flex-col items-center space-y-2 p-4 rounded-lg focus-visible"
            >
              <i className="fas fa-user-plus text-lg text-green-400"></i>
              <span className="text-sm font-medium">Add Volunteer</span>
            </button>
            <button
              onClick={() => onNavigate?.("reports")}
              className="pwa-button button-glass-secondary hover-lift flex flex-col items-center space-y-2 p-4 rounded-lg focus-visible"
            >
              <i className="fas fa-chart-line text-lg text-purple-400"></i>
              <span className="text-sm font-medium">View Reports</span>
            </button>
            <button
              onClick={() => onCreateEvent?.()}
              className="pwa-button button-glass-secondary hover-lift flex flex-col items-center space-y-2 p-4 rounded-lg focus-visible"
            >
              <i className="fas fa-calendar-alt text-lg text-orange-400"></i>
              <span className="text-sm font-medium">Schedule Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Activity Chart Section */}
      <div className="card-glass rounded-xl p-5 mt-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">
          Activity Overview
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={activityData}
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
                tick={{ fill: 'var(--chart-text)' }}
                axisLine={{ stroke: 'var(--chart-grid)' }}
                tickLine={false}
              />
              <YAxis
                stroke="var(--chart-text)"
                tick={{ fill: 'var(--chart-text)' }}
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
                              style={{ backgroundColor: entry.color === 'url(#colorEvents)' ? 'var(--chart-1)' : 'var(--chart-2)' }}
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
    </div >
  );
}
