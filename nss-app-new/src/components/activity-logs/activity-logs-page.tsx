'use client'

import { useState, useEffect, useCallback } from 'react'
import { ScrollText, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getAuditLogs, getAuditActionTypes, type AuditLogEntry } from '@/app/actions/audit'

const ACTION_COLORS: Record<string, string> = {
  'event.create': 'bg-green-500/20 text-green-400',
  'event.update': 'bg-blue-500/20 text-blue-400',
  'event.delete': 'bg-red-500/20 text-red-400',
  'hours.approve': 'bg-green-500/20 text-green-400',
  'hours.reject': 'bg-red-500/20 text-red-400',
  'hours.bulk_approve': 'bg-green-500/20 text-green-400',
  'role.assign': 'bg-purple-500/20 text-purple-400',
  'role.revoke': 'bg-orange-500/20 text-orange-400',
  'role_definition.create': 'bg-purple-500/20 text-purple-400',
  'role_definition.update': 'bg-blue-500/20 text-blue-400',
  'volunteer.update': 'bg-blue-500/20 text-blue-400',
  'volunteer.merge': 'bg-orange-500/20 text-orange-400',
}

export function ActivityLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [actionTypes, setActionTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('all')

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const [data, types] = await Promise.all([
        getAuditLogs({ limit: 100, actionFilter }),
        getAuditActionTypes(),
      ])
      setLogs(data)
      setActionTypes(types)
    } catch (err) {
      console.error('Failed to load audit logs:', err)
    } finally {
      setLoading(false)
    }
  }, [actionFilter])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Logs"
        description="Track all administrative actions across the system."
      />

      <div className="flex items-center gap-4">
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actionTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
          <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No activity logs"
          description="No audit logs match your current filter. Actions will appear here as they happen."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`border-none ${ACTION_COLORS[log.action] ?? 'bg-muted text-muted-foreground'}`}
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {log.actorName ?? 'System'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="text-xs">{log.targetType}</span>
                    {log.targetId && (
                      <span className="text-muted-foreground ml-1 text-xs">
                        ({log.targetId.slice(0, 8)})
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    {log.details ? (
                      <span className="text-muted-foreground truncate text-xs">
                        {Object.entries(log.details)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(', ')}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                    {new Date(log.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
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
