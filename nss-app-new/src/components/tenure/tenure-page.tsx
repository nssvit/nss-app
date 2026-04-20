'use client'

import { useCallback, useEffect, useState } from 'react'
import { CalendarRange } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/error-utils'
import { getCurrentTenureInfo, getTenureArchive, getTenureStats } from '@/app/actions/admin/tenure'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TenureOverviewTab } from './overview-tab'
import { TenureStatsTab } from './stats-tab'
import { TenureArchiveTab } from './archive-tab'

type TenureInfo = Awaited<ReturnType<typeof getCurrentTenureInfo>>
type Archive = Awaited<ReturnType<typeof getTenureArchive>>
type Stats = Awaited<ReturnType<typeof getTenureStats>>

export function TenurePage() {
  const [info, setInfo] = useState<TenureInfo | null>(null)
  const [archive, setArchive] = useState<Archive | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [i, a, s] = await Promise.all([
        getCurrentTenureInfo(),
        getTenureArchive(),
        getTenureStats(),
      ])
      setInfo(i)
      setArchive(a)
      setStats(s)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load tenure data'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Tenure"
          description="Manage NSS academic years, promote the batch, browse history, and export."
        />
        <div className="flex shrink-0 items-center gap-2 pt-1">
          <CalendarRange className="text-muted-foreground h-4 w-4" />
          <Badge variant="default">{info?.current?.label ?? '—'}</Badge>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="archive">
            Archive
            {archive && archive.length > 1 && (
              <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                {archive.length - 1}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <TenureOverviewTab info={info} loading={loading} onRolloverComplete={refresh} />
        </TabsContent>

        <TabsContent value="stats">
          <TenureStatsTab stats={stats} loading={loading} />
        </TabsContent>

        <TabsContent value="archive">
          <TenureArchiveTab archive={archive} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
