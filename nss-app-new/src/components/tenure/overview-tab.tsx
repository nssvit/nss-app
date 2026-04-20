'use client'

import { useState } from 'react'
import { PlayCircle } from 'lucide-react'
import { getCurrentTenureInfo } from '@/app/actions/admin/tenure'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { RolloverModal } from './rollover-modal'

type TenureInfo = Awaited<ReturnType<typeof getCurrentTenureInfo>>

interface TenureOverviewTabProps {
  info: TenureInfo | null
  loading: boolean
  onRolloverComplete: () => void
}

export function TenureOverviewTab({ info, loading, onRolloverComplete }: TenureOverviewTabProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Tenure</CardTitle>
        <CardDescription>
          Roll over to a new academic year when the current one ends. Previous tenure data stays
          queryable via the Archive tab.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Label</p>
            <p className="text-muted-foreground text-xs">
              {info?.current?.startDate ? `Started ${info.current.startDate}` : '—'}
              {info?.current?.endDate ? ` · Ends ${info.current.endDate}` : ''}
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-5 w-20" />
          ) : (
            <Badge variant="default">{info?.current?.label ?? 'None'}</Badge>
          )}
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Active 2nd years (SE)"
            value={info?.counts.activeSE ?? 0}
            loading={loading}
          />
          <StatCard
            label="Active 3rd years (TE)"
            value={info?.counts.activeTE ?? 0}
            loading={loading}
          />
          <StatCard
            label="Completed (alumni)"
            value={info?.counts.completedTotal ?? 0}
            loading={loading}
          />
        </div>

        <Separator />

        <div className="flex items-center gap-2">
          <Button onClick={() => setModalOpen(true)} disabled={loading} size="sm">
            <PlayCircle className="mr-1.5 h-4 w-4" />
            Start New Tenure
          </Button>
          <p className="text-muted-foreground text-xs">
            Promotes SE → TE, graduates TE → completed. Review each volunteer before confirming.
          </p>
        </div>

        <RolloverModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          currentLabel={info?.current?.label}
          onSuccess={onRolloverComplete}
        />
      </CardContent>
    </Card>
  )
}

function StatCard({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      {loading ? (
        <Skeleton className="mt-1 h-8 w-16" />
      ) : (
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
      )}
    </div>
  )
}
