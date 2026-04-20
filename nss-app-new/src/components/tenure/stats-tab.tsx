'use client'

import { getTenureStats } from '@/app/actions/admin/tenure'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Stats = Awaited<ReturnType<typeof getTenureStats>>

interface TenureStatsTabProps {
  stats: Stats | null
  loading: boolean
}

export function TenureStatsTab({ stats, loading }: TenureStatsTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">By Category</CardTitle>
          <CardDescription>
            Events, volunteers, and approved hours for this tenure, grouped by event category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <SkeletonRows rows={4} />
          ) : !stats || stats.byCategory.length === 0 ? (
            <EmptyMsg text="No category data yet for the current tenure." />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Events</TableHead>
                    <TableHead className="text-right">Volunteers</TableHead>
                    <TableHead className="text-right">Approved Hrs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.byCategory.map((c) => (
                    <TableRow key={c.categoryName}>
                      <TableCell className="font-medium">
                        <span
                          className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle"
                          style={{ backgroundColor: c.colorHex }}
                        />
                        {c.categoryName}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{c.eventCount}</TableCell>
                      <TableCell className="text-right tabular-nums">{c.volunteerCount}</TableCell>
                      <TableCell className="text-right tabular-nums">{c.totalHours}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">By Branch</CardTitle>
          <CardDescription>Hours and volunteer engagement per engineering branch.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <SkeletonRows rows={5} />
          ) : !stats || stats.byBranch.length === 0 ? (
            <EmptyMsg text="No branch data yet." />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Active Volunteers</TableHead>
                    <TableHead className="text-right">Participations</TableHead>
                    <TableHead className="text-right">Approved Hrs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.byBranch.map((b) => (
                    <TableRow key={b.branch}>
                      <TableCell className="font-medium">{b.branch}</TableCell>
                      <TableCell className="text-right tabular-nums">{b.volunteerCount}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {b.participationCount}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{b.totalHours}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Volunteers</CardTitle>
          <CardDescription>
            Highest approved-hour contributors in this tenure. Up to 10 shown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <SkeletonRows rows={5} />
          ) : !stats || stats.topVolunteers.length === 0 ? (
            <EmptyMsg text="No approved hours yet." />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Volunteer</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead className="text-right">Events</TableHead>
                    <TableHead className="text-right">Hrs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topVolunteers.map((v, i) => (
                    <TableRow key={v.id}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">
                        {v.firstName} {v.lastName}
                        <div className="text-muted-foreground text-xs">{v.rollNumber}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{v.branch}</TableCell>
                      <TableCell className="text-muted-foreground">{v.year}</TableCell>
                      <TableCell className="text-right tabular-nums">{v.eventsCount}</TableCell>
                      <TableCell className="text-right tabular-nums">{v.totalHours}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SkeletonRows({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}

function EmptyMsg({ text }: { text: string }) {
  return <p className="text-muted-foreground py-6 text-center text-sm">{text}</p>
}
