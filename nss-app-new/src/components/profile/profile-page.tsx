'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/page-header'
import { useProfile } from '@/hooks/use-profile'
import { ProfileHeader } from './profile-header'
import { ProfileStats } from './profile-stats'
import { ProfileForm } from './profile-form'
import { ProfileHistory } from './profile-history'

function ProfilePageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-[140px] w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  )
}

export function ProfilePage() {
  const { user, participations, loading } = useProfile()

  if (loading || !user) {
    return <ProfilePageSkeleton />
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Your profile and activity." />

      <ProfileHeader user={user} />

      <ProfileStats participations={participations} />

      <Tabs defaultValue="edit-profile">
        <TabsList>
          <TabsTrigger value="edit-profile">Edit Profile</TabsTrigger>
          <TabsTrigger value="activity-history">Activity History</TabsTrigger>
        </TabsList>
        <TabsContent value="edit-profile">
          <ProfileForm user={user} />
        </TabsContent>
        <TabsContent value="activity-history">
          <ProfileHistory participations={participations} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
