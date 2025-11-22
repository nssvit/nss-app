'use client'

interface StatsCardProps {
  title: string
  value: number | string
  icon: string
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'indigo' | 'orange'
  change?: {
    value: number
    type: 'increase' | 'decrease'
  }
}

const colorMap = {
  blue: {
    icon: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20'
  },
  green: {
    icon: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20'
  },
  yellow: {
    icon: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20'
  },
  purple: {
    icon: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20'
  },
  red: {
    icon: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20'
  },
  indigo: {
    icon: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20'
  },
  orange: {
    icon: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20'
  }
}

export function StatsCard({ title, value, icon, color, change }: StatsCardProps) {
  const colors = colorMap[color]

  return (
    <div className={`card-glass rounded-xl p-6 h-full`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-100">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${change.type === 'increase' ? 'text-green-400' : 'text-red-400'
              }`}>
              <i className={`fas ${change.type === 'increase' ? 'fa-arrow-up' : 'fa-arrow-down'
                } mr-1 text-xs`}></i>
              <span>{Math.abs(change.value)}% from last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colors.bg} ${colors.border} border`}>
          <i className={`${icon} text-xl ${colors.icon}`}></i>
        </div>
      </div>
    </div>
  )
}