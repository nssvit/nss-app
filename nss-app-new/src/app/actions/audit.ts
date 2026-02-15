'use server'

import { desc, eq, and, gte } from 'drizzle-orm'
import { db } from '@/db'
import { auditLogs } from '@/db/schema/auditLogs'
import { volunteers } from '@/db/schema/volunteers'
import { requireAdmin } from '@/lib/auth-cache'

export interface AuditLogEntry {
  id: string
  action: string
  actorId: string | null
  actorName: string | null
  targetType: string
  targetId: string | null
  details: Record<string, unknown> | null
  createdAt: string
}

/**
 * Get audit logs (admin only)
 */
export async function getAuditLogs(params?: {
  limit?: number
  offset?: number
  actionFilter?: string
  since?: string
}): Promise<AuditLogEntry[]> {
  await requireAdmin()

  const limit = params?.limit ?? 50
  const offset = params?.offset ?? 0

  const conditions = []
  if (params?.actionFilter && params.actionFilter !== 'all') {
    conditions.push(eq(auditLogs.action, params.actionFilter))
  }
  if (params?.since) {
    conditions.push(gte(auditLogs.createdAt, new Date(params.since)))
  }

  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      actorId: auditLogs.actorId,
      actorFirstName: volunteers.firstName,
      actorLastName: volunteers.lastName,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      details: auditLogs.details,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(volunteers, eq(auditLogs.actorId, volunteers.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset)

  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    actorId: r.actorId,
    actorName: r.actorFirstName && r.actorLastName
      ? `${r.actorFirstName} ${r.actorLastName}`
      : null,
    targetType: r.targetType,
    targetId: r.targetId,
    details: r.details as Record<string, unknown> | null,
    createdAt: r.createdAt.toISOString(),
  }))
}

/**
 * Get distinct action types for filter dropdown
 */
export async function getAuditActionTypes(): Promise<string[]> {
  await requireAdmin()
  const rows = await db
    .selectDistinct({ action: auditLogs.action })
    .from(auditLogs)
    .orderBy(auditLogs.action)
  return rows.map((r) => r.action)
}
