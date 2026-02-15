'use server'

import { requireAdmin } from '@/lib/auth-cache'
import { SECTION_ORDER, fetchExportData } from './shared'

function formatDate(d: Date): string {
  const m = d.getMonth() + 1
  const day = d.getDate()
  const y = d.getFullYear()
  return `${m}/${day}/${y}`
}

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

/**
 * Export all data as CSV in the original NSS Hours spreadsheet format.
 * Pivot table: rows = events (grouped by category), columns = volunteers.
 * Returns the full CSV string.
 */
export async function exportCSVData(): Promise<string> {
  await requireAdmin()

  const { vols, eventsBySection, partMap, sectionTotals } = await fetchExportData()
  const volCount = vols.length

  // Helper: build a CSV row with metadata cols + one value per volunteer + summary cols
  function buildRow(
    col0: string,
    col1: string,
    col2: string,
    col3: string,
    volValues: (string | number)[],
    appendSummary = true
  ): string {
    const meta = [col0, col1, col2, col3].map((v) => escapeCSV(String(v)))
    const vals = volValues.map((v) => (v === 0 || v === '' ? '' : String(v)))

    if (appendSummary) {
      // Count, Male, Female
      let count = 0
      let male = 0
      let female = 0
      for (let i = 0; i < vols.length; i++) {
        const v = typeof volValues[i] === 'number' ? (volValues[i] as number) : 0
        if (v > 0) {
          count++
          if (vols[i].gender === 'M') male++
          else if (vols[i].gender === 'F') female++
        }
      }
      return [...meta, ...vals, String(count), String(male), String(female)].join(',')
    }

    return [...meta, ...vals].join(',')
  }

  const lines: string[] = []

  // ─── Row 0: First names ───────────────────────────────────────
  const firstNames = vols.map((v) => v.first_name)
  lines.push(
    ['', '', '', '', ...firstNames, 'Count', 'Male', 'Female'].join(',')
  )

  // ─── Row 1: Header + Last names ──────────────────────────────
  const lastNames = vols.map((v) => v.last_name)
  lines.push(
    ['', 'Date', 'Event Name', 'Hours', ...lastNames].join(',')
  )

  // ─── Row 2: Gender row ────────────────────────────────────────
  const genders = vols.map((v) =>
    v.gender === 'M' ? 'Male' : v.gender === 'F' ? 'Female' : ''
  )
  lines.push(['', '', '', '', ...genders].join(','))

  // ─── Event rows per section ───────────────────────────────────
  for (const section of SECTION_ORDER) {
    const sectionEvents = eventsBySection.get(section) || []

    // Section header row
    lines.push(['', '', escapeCSV(section), ''].join(','))

    for (const evt of sectionEvents) {
      const date = formatDate(new Date(evt.start_date))
      const volHours: number[] = []

      for (let i = 0; i < volCount; i++) {
        const key = `${evt.id}|${vols[i].id}`
        const h = partMap.get(key) || 0
        volHours.push(h)
        if (h > 0) {
          sectionTotals.get(section)![i] += h
        }
      }

      lines.push(buildRow('', date, evt.event_name, String(evt.declared_hours), volHours))
    }

    // Section TOTAL row (Hours col = sum of event declared_hours, no Count/Male/Female)
    const totals = sectionTotals.get(section)!
    const declaredHoursSum = sectionEvents.reduce((a, e) => a + Number(e.declared_hours), 0)
    lines.push(buildRow('', '', 'TOTAL', String(declaredHoursSum), totals, false))

    // Blank row after each section
    lines.push('')
  }

  // ─── Summary rows ────────────────────────────────────────────
  lines.push('') // blank line

  const ab1 = sectionTotals.get('Area Based - 1')!
  const ab2 = sectionTotals.get('Area Based - 2')!
  const uni = sectionTotals.get('University Based')!
  const col = sectionTotals.get('College Based')!

  // Declared hours sums per section (sum of event declared_hours, not volunteer-hours)
  const ab1DeclaredSum = (eventsBySection.get('Area Based - 1') || []).reduce((a, e) => a + Number(e.declared_hours), 0)
  const ab2DeclaredSum = (eventsBySection.get('Area Based - 2') || []).reduce((a, e) => a + Number(e.declared_hours), 0)
  const uniDeclaredSum = (eventsBySection.get('University Based') || []).reduce((a, e) => a + Number(e.declared_hours), 0)
  const colDeclaredSum = (eventsBySection.get('College Based') || []).reduce((a, e) => a + Number(e.declared_hours), 0)

  // Area Based 1 Hours
  lines.push(buildRow('0', 'Area Based 1 Hours', '', String(ab1DeclaredSum), ab1))
  lines.push('')

  // Area Based 2 Hours
  lines.push(buildRow('0', 'Area Based 2 Hours', '', String(ab2DeclaredSum), ab2))
  lines.push('')

  // Total Area Based
  const totalAB = ab1.map((v, i) => v + ab2[i])
  lines.push(buildRow('0', 'Total Area Based (60)', '', String(ab1DeclaredSum + ab2DeclaredSum), totalAB))
  lines.push('')

  // University Hours
  lines.push(buildRow('0', 'University Hours', '', String(uniDeclaredSum), uni))
  lines.push('')

  // College Hours
  lines.push(buildRow('0', 'College Hours', '', String(colDeclaredSum), col))
  lines.push('')

  // Total Hours
  const grandTotal = ab1.map((v, i) => v + ab2[i] + uni[i] + col[i])
  const totalDeclaredSum = ab1DeclaredSum + ab2DeclaredSum + uniDeclaredSum + colDeclaredSum
  lines.push(buildRow('0', 'Total Hours (120)', '', String(totalDeclaredSum), grandTotal))

  return lines.join('\n')
}
