'use client'

import { useState } from 'react'
import { Search, Users, MoreHorizontal, Eye, Pencil } from 'lucide-react'
import { useVolunteers } from '@/hooks/use-volunteers'
import { useAuth } from '@/contexts/auth-context'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { ViewUserModal } from '@/components/users/view-user-modal'
import { EditUserModal } from '@/components/users/edit-user-modal'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { BRANCH_DISPLAY_NAMES, YEAR_DISPLAY_NAMES } from '@/lib/constants'
import type { VolunteerWithStats } from '@/types'

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

interface VolunteersPageProps {
  initialData?: VolunteerWithStats[]
}

export function VolunteersPage({ initialData }: VolunteersPageProps) {
  const { volunteers, loading, refresh } = useVolunteers(initialData)
  const { hasRole } = useAuth()
  const isAdmin = hasRole('admin')
  const [search, setSearch] = useState('')
  const [viewVolunteer, setViewVolunteer] = useState<VolunteerWithStats | null>(null)
  const [editVolunteer, setEditVolunteer] = useState<VolunteerWithStats | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const filtered = volunteers.filter((v) => {
    const query = search.toLowerCase()
    return (
      v.firstName.toLowerCase().includes(query) ||
      v.lastName.toLowerCase().includes(query) ||
      v.email.toLowerCase().includes(query) ||
      v.rollNumber.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Volunteers"
        description="Browse the volunteer directory and view participation stats."
      />

      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search by name, email, or roll number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No volunteers found"
          description={
            search
              ? 'No volunteers match your search criteria. Try a different query.'
              : 'No volunteers have been registered yet.'
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Roll Number</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Events Participated</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead className="w-[70px]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((volunteer) => (
                <TableRow key={volunteer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {volunteer.firstName[0]}
                          {volunteer.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {volunteer.firstName} {volunteer.lastName}
                        </p>
                        <p className="text-muted-foreground text-xs">{volunteer.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{volunteer.rollNumber}</TableCell>
                  <TableCell>{BRANCH_DISPLAY_NAMES[volunteer.branch] ?? volunteer.branch}</TableCell>
                  <TableCell>{YEAR_DISPLAY_NAMES[volunteer.year] ?? volunteer.year}</TableCell>
                  <TableCell>{volunteer.eventsParticipated ?? 0}</TableCell>
                  <TableCell>{volunteer.totalHours ?? 0}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        volunteer.isActive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      )}
                    >
                      {volunteer.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setViewVolunteer(volunteer)
                              setViewOpen(true)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditVolunteer(volunteer)
                              setEditOpen(true)
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ViewUserModal
        volunteer={viewVolunteer}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />
      <EditUserModal
        volunteer={editVolunteer}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={refresh}
      />
    </div>
  )
}
