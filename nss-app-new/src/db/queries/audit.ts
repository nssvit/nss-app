/**
 * Audit Log Queries
 * Provides audit log read operations
 */

import { eq, desc, sql } from 'drizzle-orm'
import { db } from '../index'
import { auditLogs, volunteers } from '../schema'

/**
 * Get audit logs with optional action filter
 */
export async function getAuditLogs(action?: string, limit: number = 100) {
  const result = await db.execute(sql`
    SELECT
      al.id,
      al.action,
      al.actor_id,
      al.target_type,
      al.target_id,
      al.details,
      al.created_at,
      CONCAT(v.first_name, ' ', v.last_name) as actor_name
    FROM audit_logs al
    LEFT JOIN volunteers v ON al.actor_id = v.id
    ${action ? sql`WHERE al.action = ${action}` : sql``}
    ORDER BY al.created_at DESC
    LIMIT ${limit}
  `)

  return Array.isArray(result) ? result : []
}

/**
 * Get distinct audit actions for filter dropdown
 */
export async function getDistinctAuditActions() {
  const result = await db.execute(sql`
    SELECT DISTINCT action FROM audit_logs ORDER BY action
  `)

  return (Array.isArray(result) ? result : []).map(
    (r) => (r as { action: string }).action
  )
}
