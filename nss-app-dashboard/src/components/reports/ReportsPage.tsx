'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ToastContainer, Skeleton } from '@/components/ui'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useReports } from '@/hooks/useReports'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { useToast } from '@/hooks/useToast'

export function ReportsPage() {
  const layout = useResponsiveLayout()
  const [selectedPeriod, setSelectedPeriod] = useState('monthly')
  const [selectedReport, setSelectedReport] = useState('overview')
  const { toasts, removeToast, success, info } = useToast()
  const { stats, activityData, loading: statsLoading } = useDashboardStats()
  const { categoryDistribution, topEvents, loading: reportsLoading } = useReports()

  const loading = statsLoading || reportsLoading

  // Export functions
  const handleExport = (format: string) => {
    info(`Preparing ${format.toUpperCase()} export...`)
    setTimeout(() => {
      success(`Report exported successfully as ${format.toUpperCase()}!`)
    }, 1000)
  }

  const handleDownloadReport = (reportName: string) => {
    info('Downloading report...')
    setTimeout(() => {
      success(`${reportName} downloaded successfully!`)
    }, 800)
  }

  const handleGenerateReport = () => {
    info('Generating custom report...')
    setTimeout(() => {
      success('Custom report generated successfully!')
    }, 1500)
  }

  // Transform activity data for chart
  const chartData = activityData.map((item) => ({
    month: item.month,
    events: Number(item.events_count),
    volunteers: Number(item.volunteers_count),
    hours: Number(item.hours_sum),
  }))

  // Transform category distribution for pie chart
  const categoryData = categoryDistribution.map((cat) => ({
    name: cat.category_name,
    value: Number(cat.event_count),
    color: cat.color_hex || '#6366f1',
  }))

  const reportTypes = [
    { id: 'overview', name: 'Overview Report', icon: 'fas fa-chart-pie' },
    { id: 'events', name: 'Events Report', icon: 'fas fa-calendar-check' },
    { id: 'volunteers', name: 'Volunteers Report', icon: 'fas fa-users' },
    { id: 'attendance', name: 'Attendance Report', icon: 'fas fa-user-check' },
    { id: 'hours', name: 'Hours Report', icon: 'fas fa-clock' },
    { id: 'impact', name: 'Impact Report', icon: 'fas fa-heart' },
  ]

  const timeperiods = [
    { id: 'weekly', name: 'Weekly' },
    { id: 'monthly', name: 'Monthly' },
    { id: 'quarterly', name: 'Quarterly' },
    { id: 'yearly', name: 'Yearly' },
  ]

  const metrics = stats
    ? [
        {
          title: 'Total Events',
          value: (stats.totalEvents ?? stats.total_events ?? 0).toLocaleString(),
          change: '+12%',
          changeType: 'increase' as const,
          icon: 'fas fa-calendar-check',
          color: 'text-blue-400',
        },
        {
          title: 'Active Volunteers',
          value: (stats.activeVolunteers ?? stats.active_volunteers ?? 0).toLocaleString(),
          change: '+5%',
          changeType: 'increase' as const,
          icon: 'fas fa-users',
          color: 'text-green-400',
        },
        {
          title: 'Community Hours',
          value: (stats.totalHours ?? stats.total_hours ?? 0).toLocaleString(),
          change: '+18%',
          changeType: 'increase' as const,
          icon: 'fas fa-clock',
          color: 'text-purple-400',
        },
        {
          title: 'Avg. Attendance',
          value: '78.5%',
          change: '+3%',
          changeType: 'increase' as const,
          icon: 'fas fa-user-check',
          color: 'text-orange-400',
        },
      ]
    : []

  const recentReports = [
    {
      name: 'Monthly Activity Report - November 2024',
      type: 'overview',
      date: 'Dec 1, 2024',
      status: 'Ready',
      size: '2.3 MB',
    },
    {
      name: 'Volunteer Engagement Report - Q3 2024',
      type: 'volunteers',
      date: 'Oct 15, 2024',
      status: 'Ready',
      size: '1.8 MB',
    },
    {
      name: 'Event Impact Analysis - Beach Cleanup',
      type: 'impact',
      date: 'Aug 20, 2024',
      status: 'Ready',
      size: '945 KB',
    },
  ]

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

  // Transform top events from database
  const formattedTopEvents = topEvents.map((event) => ({
    name: event.eventName || event.event_name || 'Unknown',
    participants: Number(event.participantCount || event.participant_count || 0),
    hours: Number(event.totalHours || event.total_hours || 0),
    impact: String(event.impactScore || event.impact_score || 'Low'),
  }))

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Very High':
        return 'text-green-400 bg-green-900/30'
      case 'High':
        return 'text-blue-400 bg-blue-900/30'
      case 'Medium':
        return 'text-yellow-400 bg-yellow-900/30'
      case 'Low':
        return 'text-red-400 bg-red-900/30'
      default:
        return 'text-gray-400 bg-gray-900/30'
    }
  }

  return (
    <div
      className={`main-content-bg mobile-scroll safe-area-bottom flex-1 overflow-x-hidden overflow-y-auto ${layout.getContentPadding()}`}
    >
      {/* Header Controls */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {reportTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedReport(type.id)}
              className={`pwa-button focus-visible flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium ${
                selectedReport === type.id ? 'button-glass-primary' : 'button-glass-secondary'
              }`}
            >
              <i className={`${type.icon} fa-sm`}></i>
              <span>{type.name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3">
          <select
            className="input-dark focus-visible rounded-lg px-3 py-2 text-sm focus:outline-none"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            {timeperiods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => handleExport('pdf')}
            className="pwa-button button-glass-primary hover-lift focus-visible flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium"
          >
            <i className="fas fa-download fa-sm"></i>
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div
        className={`grid ${layout.isMobile ? 'grid-cols-1' : layout.isTablet ? 'grid-cols-2' : 'grid-cols-4'} mb-6 gap-4`}
      >
        {metrics.map((metric, index) => (
          <div key={index} className="card-glass rounded-xl p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gray-800/50 ${metric.color}`}
              >
                <i className={`${metric.icon} text-lg`}></i>
              </div>
              <div
                className={`flex items-center space-x-1 text-sm ${
                  metric.changeType === 'increase' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                <i
                  className={`fas fa-arrow-${metric.changeType === 'increase' ? 'up' : 'down'} text-xs`}
                ></i>
                <span>{metric.change}</span>
              </div>
            </div>
            <h3 className="mb-1 text-2xl font-bold text-gray-100">{metric.value}</h3>
            <p className="text-sm text-gray-400">{metric.title}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className={`grid ${layout.isMobile ? 'grid-cols-1' : 'grid-cols-2'} mb-6 gap-6`}>
        {/* Monthly Trends Chart */}
        <div className="card-glass rounded-xl p-5">
          <h3 className="mb-4 text-lg font-semibold text-gray-100">Monthly Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                        <div className="rounded-lg border border-[var(--border-medium)] bg-[var(--bg-surface)] p-3 shadow-xl backdrop-blur-md">
                          <p className="mb-2 font-medium text-[var(--text-primary)]">{label}</p>
                          {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-[var(--text-secondary)] capitalize">
                                {entry.name}:
                              </span>
                              <span className="font-semibold text-[var(--text-primary)]">
                                {entry.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend wrapperStyle={{ color: 'var(--chart-text)' }} />
                <Line
                  type="monotone"
                  dataKey="events"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--chart-1)', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="volunteers"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--chart-2)', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="card-glass rounded-xl p-5">
          <h3 className="mb-4 text-lg font-semibold text-gray-100">Event Categories</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`var(--chart-${index + 1})`} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="rounded-lg border border-[var(--border-medium)] bg-[var(--bg-surface)] p-3 shadow-xl backdrop-blur-md">
                          <div className="flex items-center gap-2 text-sm">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: data.fill || data.color }}
                            />
                            <span className="text-[var(--text-secondary)]">{data.name}:</span>
                            <span className="font-semibold text-[var(--text-primary)]">
                              {data.value}%
                            </span>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Tables */}
      <div className={`grid ${layout.isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-6`}>
        {/* Top Events */}
        <div className="card-glass overflow-hidden rounded-xl">
          <div className="border-b border-gray-700/30 bg-gray-800/30 px-4 py-3">
            <h3 className="text-lg font-semibold text-gray-100">Top Events by Impact</h3>
          </div>
          <div className="divide-y divide-gray-700/30">
            {loading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : formattedTopEvents.length > 0 ? (
              formattedTopEvents.map((event, index) => (
                <div key={index} className="px-4 py-3 transition-colors hover:bg-gray-800/20">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-200">{event.name}</h4>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${getImpactColor(event.impact)}`}
                    >
                      {event.impact}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{event.participants} participants</span>
                    <span>{event.hours} hours</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-caption py-4 text-center">No events data</p>
            )}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="card-glass overflow-hidden rounded-xl">
          <div className="border-b border-gray-700/30 bg-gray-800/30 px-4 py-3">
            <h3 className="text-lg font-semibold text-gray-100">Recent Reports</h3>
          </div>
          <div className="divide-y divide-gray-700/30">
            {recentReports.map((report, index) => (
              <div key={index} className="px-4 py-3 transition-colors hover:bg-gray-800/20">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-200">{report.name}</h4>
                  <button
                    onClick={() => handleDownloadReport(report.name)}
                    className="pwa-button action-button focus-visible rounded p-1 text-indigo-400 hover:text-indigo-300"
                  >
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
      <div className="card-glass mt-6 rounded-xl p-5">
        <h3 className="mb-4 text-lg font-semibold text-gray-100">Generate Custom Report</h3>
        <div className={`grid ${layout.isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-4`}>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Report Type</label>
            <select className="input-dark focus-visible w-full rounded-lg px-3 py-2 text-sm focus:outline-none">
              <option>Event Summary</option>
              <option>Volunteer Analysis</option>
              <option>Attendance Report</option>
              <option>Impact Assessment</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Date Range</label>
            <select className="input-dark focus-visible w-full rounded-lg px-3 py-2 text-sm focus:outline-none">
              <option>Last 30 Days</option>
              <option>Last 3 Months</option>
              <option>Last 6 Months</option>
              <option>Last Year</option>
              <option>Custom Range</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Format</label>
            <select className="input-dark focus-visible w-full rounded-lg px-3 py-2 text-sm focus:outline-none">
              <option>PDF</option>
              <option>Excel</option>
              <option>CSV</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleGenerateReport}
            className="pwa-button button-glass-primary hover-lift focus-visible flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium"
          >
            <i className="fas fa-chart-bar fa-sm"></i>
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
