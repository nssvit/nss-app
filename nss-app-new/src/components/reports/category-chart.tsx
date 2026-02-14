'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { EventWithStats } from '@/types'

interface CategoryChartProps {
  events: EventWithStats[]
  loading?: boolean
}

const COLORS = ['#3b82f6', '#a855f7', '#f97316', '#6366f1', '#ef4444', '#22c55e', '#eab308']

export function CategoryChart({ events, loading }: CategoryChartProps) {
  const data = useMemo(() => {
    const grouped: Record<string, number> = {}
    for (const event of events) {
      const name = event.categoryName ?? 'Uncategorized'
      grouped[name] = (grouped[name] || 0) + 1
    }
    return Object.entries(grouped).map(([name, value]) => ({ name, value }))
  }, [events])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Events by Category</CardTitle>
        <CardDescription>Distribution of events across categories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
