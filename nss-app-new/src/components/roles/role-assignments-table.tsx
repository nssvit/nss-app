'use client'

import { useState } from 'react'
import { MoreHorizontal, ShieldOff, ShieldCheck } from 'lucide-react'
import { ROLE_DISPLAY_NAMES, ROLE_COLORS, type Role } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { revokeRole, assignRole } from '@/app/actions/roles'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { getAllRoleAssignments } from '@/app/actions/roles'

type RoleAssignment = Awaited<ReturnType<typeof getAllRoleAssignments>>[number]

interface RoleAssignmentsTableProps {
  assignments: RoleAssignment[]
  onRefresh?: () => void
}

function formatDate(date: Date | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function RoleAssignmentsTable({ assignments, onRefresh }: RoleAssignmentsTableProps) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleRevoke(assignment: RoleAssignment) {
    setLoading(assignment.id)
    try {
      await revokeRole(assignment.volunteerId, assignment.roleDefinitionId)
      onRefresh?.()
    } catch (err) {
      console.error('Failed to revoke role:', err)
    } finally {
      setLoading(null)
    }
  }

  async function handleReactivate(assignment: RoleAssignment) {
    setLoading(assignment.id)
    try {
      await assignRole(assignment.volunteerId, assignment.roleDefinitionId)
      onRefresh?.()
    } catch (err) {
      console.error('Failed to reactivate role:', err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Volunteer</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Assigned By</TableHead>
          <TableHead>Assigned At</TableHead>
          <TableHead>Expires At</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[70px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {assignments.map((assignment) => {
          const roleName = assignment.roleDefinition.roleName as Role
          const vol = assignment.volunteer
          const assigner = assignment.assignedByVolunteer
          const isLoading = loading === assignment.id
          return (
            <TableRow key={assignment.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {vol?.firstName?.[0] ?? '?'}
                      {vol?.lastName?.[0] ?? ''}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {vol ? `${vol.firstName} ${vol.lastName}` : assignment.volunteerId}
                    </p>
                    {vol?.email && (
                      <p className="text-muted-foreground text-xs">{vol.email}</p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  className={cn(ROLE_COLORS[roleName] ?? 'bg-gray-500/20 text-gray-400')}
                  variant="secondary"
                >
                  {ROLE_DISPLAY_NAMES[roleName] ?? assignment.roleDefinition.roleName}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {assigner ? `${assigner.firstName} ${assigner.lastName}` : 'System'}
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
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLoading}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {assignment.isActive ? (
                      <DropdownMenuItem
                        className="text-red-400 focus:text-red-400"
                        onClick={() => handleRevoke(assignment)}
                      >
                        <ShieldOff className="mr-2 h-4 w-4" />
                        Revoke Role
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => handleReactivate(assignment)}>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Reactivate Role
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
