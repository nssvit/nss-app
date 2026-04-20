'use server'

import { sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { parseRows } from '@/db/query-validators'
import { requireAnyRole } from '@/lib/auth-cache'

const rowSchema = z
  .object({
    id: z.string(),
    event_id: z.string().nullable(),
    event_name: z.string().nullable(),
    actor_id: z.string().nullable(),
    actor_name: z.string().nullable(),
    details: z.unknown().nullable(),
    created_at: z.union([z.string(), z.date()]),
  })
  .passthrough()

export interface GeneratedReportEntry {
  id: string
  eventId: string | null
  eventName: string | null
  actorId: string | null
  actorName: string | null
  filename: string | null
  attendeeCount: number | null
  objective: string | null
  scheme: string | null
  organizingUnit: string | null
  createdAt: string
}

export async function getGeneratedReports(limit = 200): Promise<GeneratedReportEntry[]> {
  await requireAnyRole('admin', 'head')

  const rows = await db.execute(sql`
    SELECT
      al.id,
      al.target_id AS event_id,
      e.event_name,
      al.actor_id,
      CONCAT(v.first_name, ' ', v.last_name) AS actor_name,
      al.details,
      al.created_at
    FROM audit_logs al
    LEFT JOIN volunteers v ON al.actor_id = v.id
    LEFT JOIN events e ON al.target_id::uuid = e.id
    WHERE al.action = 'report.generate'
    ORDER BY al.created_at DESC
    LIMIT ${limit}
  `)

  const parsed = parseRows(rows, rowSchema)

  return parsed.map((r) => {
    const d = (r.details ?? {}) as Record<string, unknown>
    return {
      id: r.id,
      eventId: r.event_id,
      eventName: r.event_name,
      actorId: r.actor_id,
      actorName: r.actor_name,
      filename: typeof d.filename === 'string' ? d.filename : null,
      attendeeCount: typeof d.attendeeCount === 'number' ? d.attendeeCount : null,
      objective: typeof d.objective === 'string' ? d.objective : null,
      scheme: typeof d.scheme === 'string' ? d.scheme : null,
      organizingUnit: typeof d.organizingUnit === 'string' ? d.organizingUnit : null,
      createdAt: new Date(r.created_at).toISOString(),
    }
  })
}
