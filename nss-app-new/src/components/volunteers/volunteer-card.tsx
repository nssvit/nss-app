import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  BRANCH_DISPLAY_NAMES,
  YEAR_DISPLAY_NAMES,
  ROLE_COLORS,
  ROLE_DISPLAY_NAMES,
  type Role,
} from '@/lib/constants'
import type { VolunteerWithStats } from '@/types'

interface VolunteerCardProps {
  volunteer: VolunteerWithStats
  onClick?: () => void
}

export function VolunteerCard({ volunteer, onClick }: VolunteerCardProps) {
  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', onClick && 'cursor-pointer')}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar
            className={cn(
              'h-10 w-10',
              volunteer.authUserId && 'ring-2 ring-green-500 ring-offset-1 ring-offset-background'
            )}
          >
            <AvatarFallback className="text-sm">
              {volunteer.firstName[0]}
              {volunteer.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate font-medium">
                {volunteer.firstName} {volunteer.lastName}
              </p>
              {volunteer.roleName && volunteer.roleName !== 'volunteer' && (
                <Badge
                  variant="secondary"
                  className={cn(
                    'shrink-0 border-none px-1.5 py-0 text-[10px]',
                    ROLE_COLORS[volunteer.roleName as Role]
                  )}
                >
                  {ROLE_DISPLAY_NAMES[volunteer.roleName as Role] ?? volunteer.roleName}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground truncate text-xs">{volunteer.email}</p>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              'shrink-0',
              volunteer.isActive
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            )}
          >
            {volunteer.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <div className="text-muted-foreground mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span>Roll: {volunteer.rollNumber}</span>
          <span>{BRANCH_DISPLAY_NAMES[volunteer.branch] ?? volunteer.branch}</span>
          <span>{YEAR_DISPLAY_NAMES[volunteer.year] ?? volunteer.year}</span>
          <span>{volunteer.eventsParticipated ?? 0} events · {volunteer.totalHours ?? 0}h</span>
        </div>
      </CardContent>
    </Card>
  )
}
