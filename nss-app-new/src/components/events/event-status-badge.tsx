import { Badge } from '@/components/ui/badge'
import { EVENT_STATUS_DISPLAY, EVENT_STATUS_COLORS } from '@/lib/constants'
import type { EventStatus } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface EventStatusBadgeProps {
  status: string
}

export function EventStatusBadge({ status }: EventStatusBadgeProps) {
  const label = EVENT_STATUS_DISPLAY[status as EventStatus] ?? status
  const colorClass = EVENT_STATUS_COLORS[status as EventStatus] ?? 'bg-gray-500/20 text-gray-400'

  return (
    <Badge variant="secondary" className={cn('border-none', colorClass)}>
      {label}
    </Badge>
  )
}
