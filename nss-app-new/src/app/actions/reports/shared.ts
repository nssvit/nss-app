import { sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { parseRows } from '@/db/query-validators'

// ─── Category code → section name mapping ───────────────────────
export const CATEGORY_TO_SECTION: Record<string, string> = {
  'area-based-1': 'Area Based - 1',
  'area-based-2': 'Area Based - 2',
  'university-based': 'University Based',
  'college-based': 'College Based',
}

export const SECTION_ORDER = ['Area Based - 1', 'Area Based - 2', 'University Based', 'College Based']

// ─── Validated row schemas ──────────────────────────────────────
const volRowSchema = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  gender: z.string().nullable(),
  year: z.string(),
}).passthrough()

const evtRowSchema = z.object({
  id: z.string(),
  event_name: z.string(),
  start_date: z.union([z.string(), z.date()]),
  declared_hours: z.number(),
  category_code: z.string(),
}).passthrough()

const partRowSchema = z.object({
  event_id: z.string(),
  volunteer_id: z.string(),
  hours_attended: z.number(),
}).passthrough()

// ─── Shared types (inferred from schemas) ───────────────────────
export type VolRow = z.infer<typeof volRowSchema>
export type EvtRow = z.infer<typeof evtRowSchema>

// ─── Shared data fetching for CSV/XLSX exports ──────────────────
export async function fetchExportData() {
  const volunteersRaw = await db.execute(sql`
    SELECT id, first_name, last_name, gender, year
    FROM volunteers
    WHERE is_active = true
    ORDER BY
      CASE year WHEN 'SE' THEN 0 WHEN 'TE' THEN 1 ELSE 2 END,
      first_name, last_name
  `)

  const eventsRaw = await db.execute(sql`
    SELECT e.id, e.event_name, e.start_date, e.declared_hours, ec.code as category_code
    FROM events e
    JOIN event_categories ec ON ec.id = e.category_id
    WHERE e.is_active = true AND ec.is_active = true
    ORDER BY ec.code, e.start_date
  `)

  const partRaw = await db.execute(sql`
    SELECT event_id, volunteer_id, hours_attended
    FROM event_participation
    WHERE participation_status IN ('present', 'partially_present')
      AND hours_attended > 0
  `)

  const volunteers = parseRows(volunteersRaw, volRowSchema)
  const eventsRows = parseRows(eventsRaw, evtRowSchema)
  const partRows = parseRows(partRaw, partRowSchema)

  const partMap = new Map<string, number>()
  for (const p of partRows) {
    partMap.set(`${p.event_id}|${p.volunteer_id}`, p.hours_attended)
  }

  const vols = volunteers

  const eventsBySection = new Map<string, EvtRow[]>()
  for (const section of SECTION_ORDER) eventsBySection.set(section, [])
  for (const evt of eventsRows) {
    const section = CATEGORY_TO_SECTION[evt.category_code]
    if (section && eventsBySection.has(section)) eventsBySection.get(section)!.push(evt)
  }

  const sectionTotals = new Map<string, number[]>()
  for (const section of SECTION_ORDER) {
    sectionTotals.set(section, new Array(vols.length).fill(0))
  }

  return { vols, eventsBySection, partMap, sectionTotals }
}

export function computeCountMaleFemale(vols: VolRow[], volValues: number[]): [number, number, number] {
  let count = 0, male = 0, female = 0
  for (let i = 0; i < vols.length; i++) {
    if (volValues[i] > 0) {
      count++
      if (vols[i].gender === 'M') male++
      else if (vols[i].gender === 'F') female++
    }
  }
  return [count, male, female]
}
