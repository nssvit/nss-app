'use client'

import { LayoutDashboard, User } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AdminDashboard } from './admin-dashboard'
import { VolunteerDashboard } from './volunteer-dashboard'
import type { DashboardStats, ActivityTrend } from '@/types'

interface TabbedDashboardProps {
  initialData: {
    stats: DashboardStats
    trends: ActivityTrend[]
  }
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
        <VolunteerDashboard />
      </TabsContent>
    </Tabs>
  )
}
