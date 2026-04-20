'use client'

import { useState } from 'react'
import {
  Search,
  Users,
  MoreHorizontal,
  Eye,
  Pencil,
  UserX,
  UserCheck,
  Trash2,
  UserPlus,
} from 'lucide-react'
import { toast } from 'sonner'
import type { VolunteerWithStats } from '@/types'
import { useVolunteers } from '@/hooks/use-volunteers'
import { getErrorMessage } from '@/lib/error-utils'
import { deactivateVolunteer, reactivateVolunteer } from '@/app/actions/volunteers'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ViewUserModal } from './view-user-modal'
import { EditUserModal } from './edit-user-modal'
import { PermanentDeleteModal } from './permanent-delete-modal'
import { CreateUserModal } from './create-user-modal'
import { cn } from '@/lib/utils'
import { BRANCH_DISPLAY_NAMES } from '@/lib/constants'

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

export function UserManagementPage() {
  const { volunteers, loading, refresh } = useVolunteers()
  const [search, setSearch] = useState('')
  const [viewVolunteer, setViewVolunteer] = useState<VolunteerWithStats | null>(null)
  const [editVolunteer, setEditVolunteer] = useState<VolunteerWithStats | null>(null)
  const [deleteVolunteer, setDeleteVolunteer] = useState<VolunteerWithStats | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)

  const filtered = volunteers.filter((v) => {
    const query = search.toLowerCase()
    return (
      v.firstName.toLowerCase().includes(query) ||
      v.lastName.toLowerCase().includes(query) ||
      v.email.toLowerCase().includes(query) ||
      v.rollNumber.toLowerCase().includes(query)
    )
  })

  function handleView(volunteer: VolunteerWithStats) {
    setViewVolunteer(volunteer)
    setViewOpen(true)
  }

  function handleEdit(volunteer: VolunteerWithStats) {
    setEditVolunteer(volunteer)
    setEditOpen(true)
  }

  function handlePermanentDelete(volunteer: VolunteerWithStats) {
    setDeleteVolunteer(volunteer)
    setDeleteOpen(true)
  }

  async function handleDeactivate(volunteer: VolunteerWithStats) {
    if (!confirm(`Deactivate ${volunteer.firstName} ${volunteer.lastName}? They will lose access immediately.`)) return
    setActingId(volunteer.id)
    try {
      await deactivateVolunteer(volunteer.id)
      toast.success(`${volunteer.firstName} ${volunteer.lastName} deactivated`)
      refresh()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to deactivate user'))
    } finally {
      setActingId(null)
    }
  }

  async function handleReactivate(volunteer: VolunteerWithStats) {
    setActingId(volunteer.id)
    try {
      await reactivateVolunteer(volunteer.id)
      toast.success(`${volunteer.firstName} ${volunteer.lastName} reactivated`)
      refresh()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to reactivate user'))
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage user accounts, roles, and permissions."
      />

      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by name, email, or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <UserPlus className="mr-1.5 h-4 w-4" />
          Add Volunteer
        </Button>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description={
            search
              ? 'No users match your search criteria. Try a different query.'
              : 'No users have been registered yet.'
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roll Number</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((volunteer) => (
                <TableRow key={volunteer.id}>
                  <TableCell className="font-medium">
                    {volunteer.firstName} {volunteer.lastName}
                  </TableCell>
                  <TableCell>{volunteer.email}</TableCell>
                  <TableCell>{volunteer.rollNumber}</TableCell>
                  <TableCell>{BRANCH_DISPLAY_NAMES[volunteer.branch] ?? volunteer.branch}</TableCell>
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
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(volunteer)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(volunteer)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {volunteer.isActive ? (
                          <DropdownMenuItem
                            onClick={() => handleDeactivate(volunteer)}
                            disabled={actingId === volunteer.id}
                            className="text-destructive focus:text-destructive"
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        ) : (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleReactivate(volunteer)}
                              disabled={actingId === volunteer.id}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Reactivate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handlePermanentDelete(volunteer)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Permanent Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ViewUserModal volunteer={viewVolunteer} open={viewOpen} onOpenChange={setViewOpen} />
      <EditUserModal
        volunteer={editVolunteer}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={refresh}
      />
      <PermanentDeleteModal
        volunteer={deleteVolunteer}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={refresh}
      />
      <CreateUserModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={refresh}
      />
    </div>
  )
}
