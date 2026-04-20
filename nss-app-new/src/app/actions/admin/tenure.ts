'use server'

import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { tenures, volunteers } from '@/db/schema'
import { requireAdmin } from '@/lib/auth-cache'
import { logAudit } from '@/lib/audit'

/**
 * Fetch current tenure + a preview of what rollover will affect.
 * Admin-only. Used by the Settings rollover card.
 */
export async function getCurrentTenureInfo() {
  await requireAdmin()

  const [current] = await db
    .select()
    .from(tenures)
    .where(eq(tenures.isCurrent, true))
    .limit(1)

  const rows = await db.execute(sql`
    SELECT
      COUNT(*) FILTER (WHERE year = 'SE' AND status = 'active')::int AS active_se,
      COUNT(*) FILTER (WHERE year = 'TE' AND status = 'active')::int AS active_te,
      COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_total
    FROM volunteers
  `)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw SQL
  const row = (Array.isArray(rows) ? rows[0] : null) as any

  return {
    current: current
      ? {
          id: current.id,
          label: current.label,
          startDate: current.startDate,
          endDate: current.endDate,
        }
      : null,
    counts: {
      activeSE: Number(row?.active_se ?? 0),
      activeTE: Number(row?.active_te ?? 0),
      completedTotal: Number(row?.completed_total ?? 0),
    },
  }
}

/**
 * List all tenures with aggregated stats (admin-only).
 * Drives the archive viewer. Uses explicit tenure_id filter per row instead
 * of the default current_tenure_id() scope.
 */
export async function getTenureArchive() {
  await requireAdmin()

  const result = await db.execute(sql`
    SELECT
      t.id,
      t.label,
      t.start_date,
      t.end_date,
      t.is_current,
      COALESCE(COUNT(DISTINCT e.id), 0)::int AS event_count,
      COALESCE(COUNT(DISTINCT ep.volunteer_id), 0)::int AS volunteer_count,
      COALESCE(SUM(ep.approved_hours), 0)::int AS total_hours
    FROM tenures t
    LEFT JOIN events e ON e.tenure_id = t.id AND e.is_active = true
    LEFT JOIN event_participation ep ON ep.tenure_id = t.id
    GROUP BY t.id, t.label, t.start_date, t.end_date, t.is_current
    ORDER BY t.start_date DESC
  `)

  const rows = Array.isArray(result) ? result : []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw SQL
  return rows.map((r: any) => ({
    id: r.id as string,
    label: r.label as string,
    startDate: r.start_date as string,
    endDate: (r.end_date as string | null) ?? null,
    isCurrent: Boolean(r.is_current),
    eventCount: Number(r.event_count ?? 0),
    volunteerCount: Number(r.volunteer_count ?? 0),
    totalHours: Number(r.total_hours ?? 0),
  }))
}

/**
 * Fetch events belonging to a specific tenure (admin-only archive drill-in).
 * Bypasses the default current-tenure scope.
 */
export async function getTenureEvents(tenureId: string) {
  await requireAdmin()
  z.string().uuid().parse(tenureId)

  const result = await db.execute(sql`
    SELECT
      e.id,
      e.event_name,
      e.start_date,
      e.end_date,
      e.declared_hours,
      e.event_status,
      ec.category_name,
      COALESCE(COUNT(DISTINCT ep.volunteer_id), 0)::int AS participant_count,
      COALESCE(SUM(ep.approved_hours), 0)::int AS total_hours
    FROM events e
    LEFT JOIN event_categories ec ON e.category_id = ec.id
    LEFT JOIN event_participation ep ON ep.event_id = e.id
    WHERE e.tenure_id = ${tenureId} AND e.is_active = true
    GROUP BY e.id, ec.category_name
    ORDER BY e.start_date DESC
  `)

  const rows = Array.isArray(result) ? result : []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw SQL
  return rows.map((r: any) => ({
    id: r.id as string,
    eventName: r.event_name as string,
    startDate: r.start_date as string,
    endDate: r.end_date as string,
    declaredHours: Number(r.declared_hours),
    eventStatus: r.event_status as string,
    categoryName: (r.category_name as string | null) ?? null,
    participantCount: Number(r.participant_count ?? 0),
    totalHours: Number(r.total_hours ?? 0),
  }))
}

const rolloverSchema = z.object({
  label: z.string().regex(/^\d{4}-\d{4}$/, 'Format: YYYY-YYYY (e.g. 2026-2027)'),
  startDate: z.string().date(),
  endDate: z.string().date().optional(),
})

export type RolloverInput = z.infer<typeof rolloverSchema>

/**
 * Start a new academic tenure.
 *
 * Atomic operation:
 *   1. 3rd-year (TE) actives -> status = 'completed' (NSS done)
 *   2. 2nd-year (SE) actives -> year = 'TE'
 *   3. Flip is_current: old tenure false, new tenure inserted as true
 *
 * Past events / participations / roles keep their original tenure_id and
 * become historical. The app hides them by default; admins can opt in.
 */
export async function startNewTenure(input: RolloverInput) {
  const admin = await requireAdmin()
  const parsed = rolloverSchema.parse(input)

  const result = await db.transaction(async (tx) => {
    await tx
      .update(volunteers)
      .set({ status: 'completed' })
      .where(sql`${volunteers.year} = 'TE' AND ${volunteers.status} = 'active'`)

    await tx
      .update(volunteers)
      .set({ year: 'TE' })
      .where(sql`${volunteers.year} = 'SE' AND ${volunteers.status} = 'active'`)

    await tx.update(tenures).set({ isCurrent: false }).where(eq(tenures.isCurrent, true))

    const [created] = await tx
      .insert(tenures)
      .values({
        label: parsed.label,
        startDate: parsed.startDate,
        endDate: parsed.endDate ?? null,
        isCurrent: true,
      })
      .returning()

    return created
  })

  logAudit({
    action: 'tenure.rollover',
    actorId: admin.id,
    targetType: 'tenure',
    targetId: result.id,
    details: { label: parsed.label, startDate: parsed.startDate },
  })

  revalidatePath('/', 'layout')
  return { id: result.id, label: result.label }
}
