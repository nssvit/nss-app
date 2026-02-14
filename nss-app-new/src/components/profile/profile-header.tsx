'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ROLE_DISPLAY_NAMES, ROLE_COLORS, BRANCH_DISPLAY_NAMES, YEAR_DISPLAY_NAMES, type Role } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { CurrentUser, EventParticipationWithEvent } from '@/types'

interface ProfileHeaderProps {
  user: CurrentUser
  participations: EventParticipationWithEvent[]
}

export function ProfileHeader({ user, participations }: ProfileHeaderProps) {
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
  const totalEvents = participations.length
  const totalHours = participations.reduce((sum, p) => sum + p.hoursAttended, 0)
  const approvedHours = participations
    .filter((p) => p.approvalStatus === 'approved')
    .reduce((sum, p) => sum + p.hoursAttended, 0)

  return (
    <Card className="overflow-hidden">
      <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
      <CardContent className="-mt-12 px-6 pb-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <Avatar className="border-background h-20 w-20 border-4 text-2xl">
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1 pb-1">
              <h2 className="text-2xl font-bold">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-muted-foreground text-sm">{user.email}</p>
              <div className="flex flex-wrap items-center gap-2">
                {user.roles.map((role) => (
                  <Badge key={role} className={cn(ROLE_COLORS[role as Role])}>
                    {ROLE_DISPLAY_NAMES[role as Role] ?? role}
                  </Badge>
                ))}
                <Separator orientation="vertical" className="h-4" />
                <span className="text-muted-foreground text-xs">
                  {BRANCH_DISPLAY_NAMES[user.branch] ?? user.branch} &middot; {YEAR_DISPLAY_NAMES[user.year] ?? user.year}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-6 text-center sm:gap-8">
            <div>
              <p className="text-2xl font-bold">{totalEvents}</p>
              <p className="text-muted-foreground text-xs">Events</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{totalHours}</p>
              <p className="text-muted-foreground text-xs">Total Hours</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{approvedHours}</p>
              <p className="text-muted-foreground text-xs">Approved</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
