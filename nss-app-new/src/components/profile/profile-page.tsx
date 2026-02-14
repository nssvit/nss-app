'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/page-header'
import { useProfile } from '@/hooks/use-profile'
import { ProfileHeader } from './profile-header'
import { ProfileForm } from './profile-form'
import { ProfileHistory } from './profile-history'
import type { EventParticipationWithEvent } from '@/types'

function ProfilePageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-[200px] w-full rounded-xl" />
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  )
}

interface ProfilePageProps {
  initialParticipations?: EventParticipationWithEvent[]
}

export function ProfilePage({ initialParticipations }: ProfilePageProps) {
  const { user, participations, loading } = useProfile(initialParticipations)

  if (loading || !user) {
    return <ProfilePageSkeleton />
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Your profile and activity." />

      <ProfileHeader user={user} participations={participations} />

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
