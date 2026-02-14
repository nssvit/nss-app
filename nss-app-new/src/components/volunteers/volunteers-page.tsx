'use client'

import { useState } from 'react'
import { Search, Users } from 'lucide-react'
import { useVolunteers } from '@/hooks/use-volunteers'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

export function VolunteersPage() {
  const { volunteers, loading } = useVolunteers()
  const [search, setSearch] = useState('')

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((volunteer) => (
                <TableRow key={volunteer.id}>
                  <TableCell className="font-medium">
                    {volunteer.firstName} {volunteer.lastName}
                  </TableCell>
                  <TableCell>{volunteer.rollNumber}</TableCell>
                  <TableCell>{volunteer.branch}</TableCell>
                  <TableCell>{volunteer.year}</TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
