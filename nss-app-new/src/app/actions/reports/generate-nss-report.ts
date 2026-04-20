'use server'

import { z } from 'zod'
import { requireAnyRole } from '@/lib/auth-cache'
import { logAudit } from '@/lib/audit'
import { queries } from '@/db/queries'
import {
  formatEventDataForLLM,
  formatFullDate,
  formatTimeRange,
  computeGenderStats,
} from '@/lib/reports/format'
import { generateNssMarkdown } from '@/lib/reports/gemini'
import { parseNssMarkdown, buildReportFilename, fillNssReportTemplate } from '@/lib/reports/docx'

const ACTIVITY_COORDINATOR = 'Prof. Rakshak Sood'
const DEFAULT_ORGANIZING_UNIT = 'NSS-VIT'

const inputSchema = z.object({
  eventId: z.string().uuid(),
  majorObjective: z.string().trim().min(10).max(500),
  scheme: z.string().trim().max(100).optional(),
  organizingUnit: z.string().trim().max(100).optional(),
})

export interface GenerateReportResult {
  filename: string
  /** base64-encoded .docx bytes — client decodes and triggers download. */
  fileBase64: string
}

export async function generateNssReport(raw: unknown): Promise<GenerateReportResult> {
  const input = inputSchema.parse(raw)
  const actor = await requireAnyRole('admin', 'head')

  const data = await queries.getEventReportInputs(input.eventId)
  if (!data) throw new Error('Event not found')

  const { header, attendees } = data
  if (attendees.length === 0) {
    throw new Error('No attendees marked present — nothing to report')
  }

  const scheme = input.scheme?.trim() || header.category_name || 'NSS'
  const organizingUnit = input.organizingUnit?.trim() || DEFAULT_ORGANIZING_UNIT

  const eventData = formatEventDataForLLM(header, attendees)
  const schemeOrganizer = `${scheme} / ${organizingUnit}`

  const markdown = await generateNssMarkdown({
    eventData,
    majorObjective: input.majorObjective,
    schemeOrganizer,
  })

  const parsed = parseNssMarkdown(markdown)

  const start = new Date(header.start_date)
  const end = new Date(header.end_date)
  const stats = computeGenderStats(attendees)

  const buffer = await fillNssReportTemplate({
    activityTitle: parsed.activityTitle || header.event_name,
    date: parsed.eventDetails['Date'] || formatFullDate(start),
    venue: parsed.eventDetails['Venue'] || header.location || 'N/A',
    time: parsed.eventDetails['Time'] || formatTimeRange(start, end),
    volunteers:
      parsed.eventDetails['No. of Volunteers'] ||
      `${stats.total} (Male: ${stats.male}, Female: ${stats.female})`,
    activityCoordinator: parsed.eventDetails['Activity Coordinator'] || ACTIVITY_COORDINATOR,
    scheme: parsed.eventDetails['Name of Scheme'] || scheme,
    organizingUnit: parsed.eventDetails['Organizing Unit'] || organizingUnit,
    objectives: parsed.objectives,
    description: parsed.description,
    impact: parsed.impact,
    conclusion: parsed.conclusion,
  })

  const filename = buildReportFilename(parsed, start)

  logAudit({
    action: 'report.generate',
    actorId: actor.id,
    targetType: 'event',
    targetId: input.eventId,
    details: {
      filename,
      attendeeCount: attendees.length,
      objective: input.majorObjective,
      scheme,
      organizingUnit,
    },
  })

  return {
    filename,
    fileBase64: buffer.toString('base64'),
  }
}
