import type { UserRoleWithDefinition } from '@/types'
import { ROLE_DISPLAY_NAMES, ROLE_COLORS, type Role } from '@/lib/constants'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface RoleAssignmentsTableProps {
  assignments: UserRoleWithDefinition[]
}

function formatDate(date: Date | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function RoleAssignmentsTable({ assignments }: RoleAssignmentsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Volunteer ID</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Assigned By</TableHead>
          <TableHead>Assigned At</TableHead>
          <TableHead>Expires At</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assignments.map((assignment) => {
          const roleName = assignment.roleDefinition.roleName as Role
          return (
            <TableRow key={assignment.id}>
              <TableCell className="font-medium">{assignment.volunteerId}</TableCell>
              <TableCell>
                <Badge
                  className={cn(ROLE_COLORS[roleName] ?? 'bg-gray-500/20 text-gray-400')}
                  variant="secondary"
                >
                  {ROLE_DISPLAY_NAMES[roleName] ?? assignment.roleDefinition.roleName}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {assignment.assignedBy ?? 'System'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(assignment.assignedAt)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(assignment.expiresAt)}
              </TableCell>
              <TableCell>
                <Badge
                  className={cn(
                    assignment.isActive
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  )}
                  variant="secondary"
                >
                  {assignment.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
