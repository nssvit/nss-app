"use client";

import { useState } from "react";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

export function ReportsPage() {
  const layout = useResponsiveLayout();
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [selectedReport, setSelectedReport] = useState("overview");

  const reportTypes = [
    { id: "overview", name: "Overview Report", icon: "fas fa-chart-pie" },
    { id: "events", name: "Events Report", icon: "fas fa-calendar-check" },
    { id: "volunteers", name: "Volunteers Report", icon: "fas fa-users" },
    { id: "attendance", name: "Attendance Report", icon: "fas fa-user-check" },
    { id: "hours", name: "Hours Report", icon: "fas fa-clock" },
    { id: "impact", name: "Impact Report", icon: "fas fa-heart" },
  ];

  const timeperiods = [
    { id: "weekly", name: "Weekly" },
    { id: "monthly", name: "Monthly" },
    { id: "quarterly", name: "Quarterly" },
    { id: "yearly", name: "Yearly" },
  ];

  const metrics = [
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
      title: "Avg. Attendance",
      value: "78.5%",
      change: "+3%",
      changeType: "increase" as const,
      icon: "fas fa-user-check",
      color: "text-orange-400",
    },
  ];

  const recentReports = [
    {
      name: "Monthly Activity Report - November 2024",
      type: "overview",
      date: "Dec 1, 2024",
      status: "Ready",
      size: "2.3 MB",
    },
    {
      name: "Volunteer Engagement Report - Q3 2024",
      type: "volunteers",
      date: "Oct 15, 2024",
      status: "Ready",
      size: "1.8 MB",
    },
    {
      name: "Event Impact Analysis - Beach Cleanup",
      type: "impact",
      date: "Aug 20, 2024",
      status: "Ready",
      size: "945 KB",
    },
  ];

  // Chart data for future Chart.js integration
  // const chartData = [
  //   { month: 'Jan', events: 18, volunteers: 145, hours: 720 },
  //   { month: 'Feb', events: 22, volunteers: 167, hours: 890 },
  //   { month: 'Mar', events: 25, volunteers: 189, hours: 1050 },
  //   { month: 'Apr', events: 28, volunteers: 203, hours: 1200 },
  //   { month: 'May', events: 24, volunteers: 198, hours: 1100 },
  //   { month: 'Jun', events: 31, volunteers: 234, hours: 1350 },
  //   { month: 'Jul', events: 29, volunteers: 221, hours: 1280 },
  //   { month: 'Aug', events: 26, volunteers: 208, hours: 1180 },
  //   { month: 'Sep', events: 33, volunteers: 245, hours: 1420 },
  //   { month: 'Oct', events: 35, volunteers: 267, hours: 1580 },
  //   { month: 'Nov', events: 32, volunteers: 251, hours: 1450 },
  //   { month: 'Dec', events: 27, volunteers: 223, hours: 1320 }
  // ]

  const topEvents = [
    {
      name: "Blood Donation Drive",
      participants: 118,
      hours: 354,
      impact: "High",
    },
    {
      name: "NSS Camp - Kuderan",
      participants: 48,
      hours: 2400,
      impact: "Very High",
    },
    { name: "Beach Clean-Up", participants: 73, hours: 292, impact: "High" },
    {
      name: "Digital Literacy Workshop",
      participants: 32,
      hours: 192,
      impact: "Medium",
    },
    { name: "Tree Plantation", participants: 67, hours: 201, impact: "High" },
  ];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "Very High":
        return "text-green-400 bg-green-900/30";
      case "High":
        return "text-blue-400 bg-blue-900/30";
      case "Medium":
        return "text-yellow-400 bg-yellow-900/30";
      case "Low":
        return "text-red-400 bg-red-900/30";
      default:
        return "text-gray-400 bg-gray-900/30";
    }
  };

  return (
    <div
      className={`flex-1 overflow-x-hidden overflow-y-auto main-content-bg mobile-scroll safe-area-bottom ${layout.getContentPadding()}`}
    >
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {reportTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedReport(type.id)}
              className={`pwa-button flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium focus-visible ${
                selectedReport === type.id
                  ? "button-glass-primary"
                  : "button-glass-secondary"
              }`}
            >
              <i className={`${type.icon} fa-sm`}></i>
              <span>{type.name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3">
          <select
            className="input-dark text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            {timeperiods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.name}
              </option>
            ))}
          </select>
          <button className="pwa-button button-glass-primary hover-lift flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium focus-visible">
            <i className="fas fa-download fa-sm"></i>
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div
        className={`grid ${layout.isMobile ? "grid-cols-1" : layout.isTablet ? "grid-cols-2" : "grid-cols-4"} gap-4 mb-6`}
      >
        {metrics.map((metric, index) => (
          <div key={index} className="card-glass rounded-xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-12 h-12 rounded-lg bg-gray-800/50 flex items-center justify-center ${metric.color}`}
              >
                <i className={`${metric.icon} text-lg`}></i>
              </div>
              <div
                className={`flex items-center space-x-1 text-sm ${
                  metric.changeType === "increase"
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                <i
                  className={`fas fa-arrow-${metric.changeType === "increase" ? "up" : "down"} text-xs`}
                ></i>
                <span>{metric.change}</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-100 mb-1">
              {metric.value}
            </h3>
            <p className="text-sm text-gray-400">{metric.title}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div
        className={`grid ${layout.isMobile ? "grid-cols-1" : "grid-cols-2"} gap-6 mb-6`}
      >
        {/* Monthly Trends Chart */}
        <div className="card-glass rounded-xl p-5">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">
            Monthly Trends
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <i className="fas fa-chart-line text-4xl mb-3"></i>
              <p>Monthly trends chart</p>
              <p className="text-sm mt-1">
                Integration with Chart.js coming soon
              </p>
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="card-glass rounded-xl p-5">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">
            Event Categories
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <i className="fas fa-chart-pie text-4xl mb-3"></i>
              <p>Category distribution chart</p>
              <p className="text-sm mt-1">
                Integration with Chart.js coming soon
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Tables */}
      <div
        className={`grid ${layout.isMobile ? "grid-cols-1" : "grid-cols-2"} gap-6`}
      >
        {/* Top Events */}
        <div className="card-glass rounded-xl overflow-hidden">
          <div className="bg-gray-800/30 px-4 py-3 border-b border-gray-700/30">
            <h3 className="text-lg font-semibold text-gray-100">
              Top Events by Impact
            </h3>
          </div>
          <div className="divide-y divide-gray-700/30">
            {topEvents.map((event, index) => (
              <div
                key={index}
                className="px-4 py-3 hover:bg-gray-800/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-200 text-sm">
                    {event.name}
                  </h4>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getImpactColor(event.impact)}`}
                  >
                    {event.impact}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>{event.participants} participants</span>
                  <span>{event.hours} hours</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="card-glass rounded-xl overflow-hidden">
          <div className="bg-gray-800/30 px-4 py-3 border-b border-gray-700/30">
            <h3 className="text-lg font-semibold text-gray-100">
              Recent Reports
            </h3>
          </div>
          <div className="divide-y divide-gray-700/30">
            {recentReports.map((report, index) => (
              <div
                key={index}
                className="px-4 py-3 hover:bg-gray-800/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-200 text-sm">
                    {report.name}
                  </h4>
                  <button className="pwa-button action-button text-indigo-400 hover:text-indigo-300 p-1 rounded focus-visible">
                    <i className="fas fa-download text-sm"></i>
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{report.date}</span>
                  <span>{report.size}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Report Section */}
      <div className="card-glass rounded-xl p-5 mt-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">
          Generate Custom Report
        </h3>
        <div
          className={`grid ${layout.isMobile ? "grid-cols-1" : "grid-cols-3"} gap-4`}
        >
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Report Type
            </label>
            <select className="input-dark text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible w-full">
              <option>Event Summary</option>
              <option>Volunteer Analysis</option>
              <option>Attendance Report</option>
              <option>Impact Assessment</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date Range
            </label>
            <select className="input-dark text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible w-full">
              <option>Last 30 Days</option>
              <option>Last 3 Months</option>
              <option>Last 6 Months</option>
              <option>Last Year</option>
              <option>Custom Range</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Format
            </label>
            <select className="input-dark text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible w-full">
              <option>PDF</option>
              <option>Excel</option>
              <option>CSV</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button className="pwa-button button-glass-primary hover-lift flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium focus-visible">
            <i className="fas fa-chart-bar fa-sm"></i>
            <span>Generate Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
