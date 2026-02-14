'use client'

import { type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number; label: string }
  className?: string
}

export function StatsCard({ title, value, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {trend && (
              <p
                className={cn(
                  'text-xs font-medium',
                  trend.value >= 0 ? 'text-emerald-500' : 'text-red-500'
                )}
              >
                {trend.value >= 0 ? '+' : ''}
                {trend.value}% {trend.label}
              </p>
            )}
          </div>
          <div className="bg-primary/10 rounded-xl p-3">
            <Icon className="text-primary h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
