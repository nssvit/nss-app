'use client'

import { Suspense } from 'react'
import { LayoutDashboard, User } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { AdminDashboard } from './admin-dashboard'
import { VolunteerDashboard } from './volunteer-dashboard'
import type { DashboardStats, ActivityTrend } from '@/types'

interface TabbedDashboardProps {
  initialData: {
    stats: DashboardStats
    trends: ActivityTrend[]
  }
}

function VolunteerTabSkeleton() {
  return (
    <div className="space-y-6 pt-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  )
}

export function TabbedDashboard({ initialData }: TabbedDashboardProps) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">
          <LayoutDashboard className="mr-1.5 h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="my-activity">
          <User className="mr-1.5 h-4 w-4" />
          My Activity
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <AdminDashboard initialData={initialData} />
      </TabsContent>
      <TabsContent value="my-activity">
        <Suspense fallback={<VolunteerTabSkeleton />}>
          <VolunteerDashboard />
        </Suspense>
      </TabsContent>
    </Tabs>
  )
}
