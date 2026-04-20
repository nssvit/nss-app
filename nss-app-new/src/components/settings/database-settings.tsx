'use client'

import { useState, useEffect, useCallback } from 'react'
import { Database, RefreshCw, CheckCircle2, XCircle, ArrowRightLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { getDbStatus, switchDbProvider, type DbStatus } from '@/app/actions/admin/db-provider'
import { toast } from 'sonner'

export function DatabaseSettings() {
  const [status, setStatus] = useState<DbStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getDbStatus()
      setStatus(result)
    } catch {
      toast.error('Failed to fetch database status')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleSwitch(provider: string) {
    setSwitching(true)
    try {
      const result = await switchDbProvider(provider)
      setStatus(result)
      toast.success(`Switched to ${provider} database`)
    } catch {
      toast.error('Failed to switch database provider')
    } finally {
      setSwitching(false)
    }
  }

  const switchTargets = status?.availableProviders.filter((p) => p !== status.activeProvider) ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          Database Provider
        </CardTitle>
        <CardDescription>
          Manage database failover{switchTargets.length > 0 ? ' and provider switching' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active provider */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Active Provider</p>
            <p className="text-muted-foreground text-xs">Currently serving all database queries</p>
          </div>
          {loading ? (
            <Badge variant="outline">Loading...</Badge>
          ) : (
            <Badge variant="default" className="capitalize">
              {status?.activeProvider ?? 'unknown'}
            </Badge>
          )}
        </div>

        <Separator />

        {/* Health status */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Connection Health</p>
          {status?.health.map((h) => (
            <div
              key={h.provider}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="flex items-center gap-2">
                {h.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm capitalize">{h.provider}</span>
                {h.provider === status.activeProvider && (
                  <Badge variant="outline" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
              <div className="text-muted-foreground text-xs">
                {h.ok ? `${h.latencyMs}ms` : (h.error ?? 'Unavailable')}
              </div>
            </div>
          ))}
          {loading && !status && (
            <div className="text-muted-foreground text-sm">Checking connections...</div>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`mr-1 h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {switchTargets.map((target) => (
            <AlertDialog key={target}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={switching || loading}>
                  <ArrowRightLeft className="mr-1 h-3 w-3" />
                  Switch to {target}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Switch Database Provider</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will switch all database queries from {status?.activeProvider ?? 'current'}{' '}
                    to {target}. Active sessions and in-flight requests may be affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleSwitch(target)}>
                    {switching ? 'Switching...' : `Switch to ${target}`}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
