import { db } from '@/db'
import { auditLogs } from '@/db/schema/auditLogs'

interface AuditParams {
  action: string
  actorId?: string
  targetType: string
  targetId?: string
  details?: Record<string, unknown>
}

/**
 * Log an audit event. Fire-and-forget — failures are caught
 * and logged to console so they never break the main operation.
 */
export function logAudit(params: AuditParams): void {
  db.insert(auditLogs)
    .values({
      action: params.action,
      actorId: params.actorId,
      targetType: params.targetType,
      targetId: params.targetId,
      details: params.details,
    })
    .then(() => {})
    .catch((err) => {
      console.error('[audit] Failed to write audit log:', err)
    })
}
