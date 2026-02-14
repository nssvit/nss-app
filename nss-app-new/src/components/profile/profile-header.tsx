'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ROLE_DISPLAY_NAMES, ROLE_COLORS, type Role } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { CurrentUser } from '@/types'

interface ProfileHeaderProps {
  user: CurrentUser
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20 text-2xl">
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <div>
              <h2 className="text-2xl font-bold">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {user.roles.map((role) => (
                <Badge key={role} className={cn(ROLE_COLORS[role as Role])}>
                  {ROLE_DISPLAY_NAMES[role as Role] ?? role}
                </Badge>
              ))}
            </div>
            <p className="text-muted-foreground text-sm">
              {user.branch} &middot; Year {user.year}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
