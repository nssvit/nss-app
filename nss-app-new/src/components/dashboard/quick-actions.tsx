'use client'

import Link from 'next/link'
import { Calendar, Users, CheckCircle, BarChart3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface QuickAction {
  label: string
  href: string
  icon: React.ElementType
  color: string
}

const actions: QuickAction[] = [
  {
    label: 'Create Event',
    href: '/events',
    icon: Calendar,
    color: 'text-blue-500 bg-blue-500/10',
  },
  {
    label: 'View Volunteers',
    href: '/volunteers',
    icon: Users,
    color: 'text-emerald-500 bg-emerald-500/10',
  },
  {
    label: 'Mark Attendance',
    href: '/attendance',
    icon: CheckCircle,
    color: 'text-amber-500 bg-amber-500/10',
  },
  {
    label: 'View Reports',
    href: '/reports',
    icon: BarChart3,
    color: 'text-purple-500 bg-purple-500/10',
  },
]

export function QuickActions() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {actions.map((action) => (
        <Link key={action.label} href={action.href}>
          <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
              <div className={cn('rounded-xl p-3', action.color)}>
                <action.icon className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">{action.label}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
