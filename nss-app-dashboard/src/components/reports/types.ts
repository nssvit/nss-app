/**
 * Reports Types
 */

export interface ReportMetric {
  title: string
  value: string
  change: string
  changeType: 'increase' | 'decrease' | 'neutral'
  icon: string
  color: string
}

export interface CategoryData {
  name: string
  value: number
  color: string
}

export interface ChartData {
  month: string
  events: number
  volunteers: number
  hours: number
}

export interface TopEvent {
  name: string
  participants: number
  hours: number
  impact: string
}

export interface ReportType {
  id: string
  name: string
  icon: string
}
