"use client";

import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

export function DashboardPage() {
  const layout = useResponsiveLayout();

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
          Welcome back, Prof. Rakshak!
        </h2>
        <p className="text-gray-400">
          Here&apos;s what&apos;s happening with your NSS activities today.
        </p>
      </div>

      {/* Stats Grid */}
      <div
        className={`grid ${layout.isMobile ? "grid-cols-1" : layout.isTablet ? "grid-cols-2" : "grid-cols-4"} gap-4 mb-6`}
      >
        {stats.map((stat, index) => (
          <div key={index} className="card-glass rounded-xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-12 h-12 rounded-lg bg-gray-800/50 flex items-center justify-center ${stat.color}`}
              >
                <i className={`${stat.icon} text-lg`}></i>
              </div>
              <div
                className={`flex items-center space-x-1 text-sm ${
                  stat.changeType === "increase"
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                <i
                  className={`fas fa-arrow-${stat.changeType === "increase" ? "up" : "down"} text-xs`}
                ></i>
                <span>{stat.change}</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-100 mb-1">
              {stat.value}
            </h3>
            <p className="text-sm text-gray-400">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div
        className={`grid ${layout.isMobile ? "grid-cols-1" : "grid-cols-2"} gap-6`}
      >
        {/* Recent Events */}
        <div className="card-glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-100">
              Recent Events
            </h3>
            <button className="text-sm text-indigo-400 hover:text-indigo-300">
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentEvents.map((event, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-200 text-sm">
                    {event.title}
                  </h4>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-500">{event.date}</span>
                    <span className="text-xs text-gray-500">
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
        <div className="card-glass rounded-xl p-5">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="pwa-button button-glass-primary hover-lift flex flex-col items-center space-y-2 p-4 rounded-lg focus-visible">
              <i className="fas fa-plus text-lg text-indigo-400"></i>
              <span className="text-sm font-medium">Create Event</span>
            </button>
            <button className="pwa-button button-glass-secondary hover-lift flex flex-col items-center space-y-2 p-4 rounded-lg focus-visible">
              <i className="fas fa-user-plus text-lg text-green-400"></i>
              <span className="text-sm font-medium">Add Volunteer</span>
            </button>
            <button className="pwa-button button-glass-secondary hover-lift flex flex-col items-center space-y-2 p-4 rounded-lg focus-visible">
              <i className="fas fa-chart-line text-lg text-purple-400"></i>
              <span className="text-sm font-medium">View Reports</span>
            </button>
            <button className="pwa-button button-glass-secondary hover-lift flex flex-col items-center space-y-2 p-4 rounded-lg focus-visible">
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
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <i className="fas fa-chart-area text-4xl mb-3"></i>
            <p>Activity chart will be displayed here</p>
            <p className="text-sm mt-1">
              Integration with Chart.js coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
