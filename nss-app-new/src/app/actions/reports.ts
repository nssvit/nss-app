'use server'

import { sql } from 'drizzle-orm'
import ExcelJS from 'exceljs'
import { db } from '@/db'
import { queries } from '@/db/queries'
import { getAuthUser, requireAdmin } from '@/lib/auth-cache'
import {
  mapCategoryDistributionRow,
  mapTopEventRow,
} from '@/lib/mappers'

/**
 * Get category distribution for reports
 * Returns: event count, participant count, total hours per category
 */
export async function getCategoryDistribution() {
  await getAuthUser()
  const rows = await queries.getCategoryDistribution()
  return rows.map(mapCategoryDistributionRow)
}

/**
 * Get top events by impact score
 * Impact = participant_count × total_hours
 */
export async function getTopEventsByImpact(limit?: number) {
  await getAuthUser()
  const rows = await queries.getTopEventsByImpact(limit)
  return rows.map(mapTopEventRow)
}

// ─── Category code → section name mapping ───────────────────────
const CATEGORY_TO_SECTION: Record<string, string> = {
  'area-based-1': 'Area Based - 1',
  'area-based-2': 'Area Based - 2',
  'university-based': 'University Based',
  'college-based': 'College Based',
}

const SECTION_ORDER = ['Area Based - 1', 'Area Based - 2', 'University Based', 'College Based']

function formatDate(d: Date): string {
  const m = d.getMonth() + 1
  const day = d.getDate()
  const y = d.getFullYear()
  return `${m}/${day}/${y}`
}

// ─── Shared data fetching for CSV/XLSX exports ──────────────────
type VolRow = { id: string; first_name: string; last_name: string; gender: string | null; year: string; [k: string]: unknown }
type EvtRow = { id: string; event_name: string; start_date: string; declared_hours: number; category_code: string; [k: string]: unknown }

async function fetchExportData() {
  const volunteers = await db.execute<VolRow>(sql`
    SELECT id, first_name, last_name, gender, year
    FROM volunteers
    WHERE is_active = true
    ORDER BY
      CASE year WHEN 'SE' THEN 0 WHEN 'TE' THEN 1 ELSE 2 END,
      first_name, last_name
  `)

  const eventsRows = await db.execute<EvtRow>(sql`
    SELECT e.id, e.event_name, e.start_date, e.declared_hours, ec.code as category_code
    FROM events e
    JOIN event_categories ec ON ec.id = e.category_id
    WHERE e.is_active = true AND ec.is_active = true
    ORDER BY ec.code, e.start_date
  `)

  const partRows = await db.execute<{ event_id: string; volunteer_id: string; hours_attended: number }>(sql`
    SELECT event_id, volunteer_id, hours_attended
    FROM event_participation
    WHERE participation_status IN ('present', 'partially_present')
      AND hours_attended > 0
  `)

  const partMap = new Map<string, number>()
  for (const p of partRows) {
    partMap.set(`${p.event_id}|${p.volunteer_id}`, p.hours_attended)
  }

  const vols = [...volunteers]

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

function computeCountMaleFemale(vols: VolRow[], volValues: number[]): [number, number, number] {
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

// ─── XLSX Export ────────────────────────────────────────────────

const PURPLE_FILL: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF550091' } }
const NAVY_FILL: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } }
const LIGHT_BLUE_FILL: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF73B2FF' } }
const TEAL_FILL: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF46BDC6' } }

const BASE_FONT: Partial<ExcelJS.Font> = { name: 'Comic Sans MS', size: 12 }
const BOLD_FONT: Partial<ExcelJS.Font> = { ...BASE_FONT, bold: true }
const WHITE_BOLD: Partial<ExcelJS.Font> = { ...BASE_FONT, bold: true, color: { argb: 'FFFFFFFF' } }

const CENTER_ALIGN: Partial<ExcelJS.Alignment> = { horizontal: 'center', vertical: 'middle' }

const MEDIUM_BORDER: Partial<ExcelJS.Border> = { style: 'medium' }

/** Convert 1-based column index to Excel letter (1→A, 26→Z, 27→AA, etc.) */
function colLetter(col: number): string {
  let s = ''
  let c = col
  while (c > 0) {
    c--
    s = String.fromCharCode(65 + (c % 26)) + s
    c = Math.floor(c / 26)
  }
  return s
}

/** Create an ExcelJS formula cell value with a cached result */
function formulaCell(formula: string, result: number): ExcelJS.CellFormulaValue {
  return { formula, result }
}

/**
 * Export all data as XLSX matching the original NSS Hours spreadsheet format.
 * Cells use live Excel formulas (SUM, COUNT, COUNTIFS) with cached results.
 * Returns base64-encoded XLSX buffer.
 */
export async function exportXLSXData(): Promise<string> {
  await requireAdmin()

  const { vols, eventsBySection, partMap, sectionTotals } = await fetchExportData()
  const volCount = vols.length

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('2025-2026', { views: [{ state: 'frozen', ySplit: 2 }] })

  // Column indices: A=1, B=2, C=3, D=4, volunteers start at col 5
  const volStartCol = 5
  const countCol = volStartCol + volCount
  const maleCol = countCol + 1
  const femaleCol = maleCol + 1
  const totalCols = femaleCol

  // Pre-compute column letters for formula building
  const volFirstLetter = colLetter(volStartCol)          // E
  const volLastLetter = colLetter(volStartCol + volCount - 1)
  const genderRow = 3 // row with Male/Female labels

  // Volunteer range string e.g. "E{r}:DN{r}"
  const volRange = (r: number) => `${volFirstLetter}${r}:${volLastLetter}${r}`
  // Absolute gender row range e.g. "$E$3:$DN$3"
  const genderRange = `$${volFirstLetter}$${genderRow}:$${volLastLetter}$${genderRow}`

  // ─── Column widths ──────────────────────────────────────────
  ws.getColumn(1).width = 9
  ws.getColumn(2).width = 20
  ws.getColumn(3).width = 44
  ws.getColumn(4).width = 8
  for (let c = volStartCol; c <= volStartCol + volCount - 1; c++) ws.getColumn(c).width = 11
  ws.getColumn(countCol).width = 8
  ws.getColumn(maleCol).width = 8
  ws.getColumn(femaleCol).width = 8

  // Helper to style a full row
  function styleRow(row: ExcelJS.Row, font: Partial<ExcelJS.Font>, fill?: ExcelJS.FillPattern) {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = font
      cell.alignment = CENTER_ALIGN
      if (fill) cell.fill = fill
    })
    const cellA = row.getCell(1)
    cellA.border = { ...cellA.border, left: MEDIUM_BORDER }
    const cellD = row.getCell(4)
    cellD.border = { ...cellD.border, right: MEDIUM_BORDER }
  }

  /** Set Count/Male/Female formula cells on a row */
  function setCountFormulas(row: ExcelJS.Row, r: number, volHours: number[]) {
    const [cnt, m, f] = computeCountMaleFemale(vols, volHours)
    row.getCell(countCol).value = formulaCell(
      `COUNT(${volRange(r)})`, cnt
    )
    row.getCell(maleCol).value = formulaCell(
      `COUNTIFS(${genderRange},"Male",${volRange(r)},"<>")`, m
    )
    row.getCell(femaleCol).value = formulaCell(
      `COUNTIFS(${genderRange},"Female",${volRange(r)},"<>")`, f
    )
  }

  // ─── Row 1: First names + Count/Male/Female ─────────────────
  const row1 = ws.getRow(1)
  row1.height = 19.5
  row1.getCell(1).value = 11
  for (let i = 0; i < volCount; i++) row1.getCell(volStartCol + i).value = vols[i].first_name
  row1.getCell(countCol).value = 'Count'
  row1.getCell(maleCol).value = 'Male'
  row1.getCell(femaleCol).value = 'Female'
  styleRow(row1, BOLD_FONT)
  row1.getCell(1).fill = NAVY_FILL
  row1.getCell(1).font = WHITE_BOLD
  ws.mergeCells(1, 1, 1, 4)
  ws.mergeCells(1, countCol, 2, countCol)
  ws.mergeCells(1, maleCol, 2, maleCol)
  ws.mergeCells(1, femaleCol, 2, femaleCol)

  // ─── Row 2: Date/Event Name/Hours + Last names ─────────────
  const row2 = ws.getRow(2)
  row2.height = 37.5
  row2.getCell(1).value = 11
  row2.getCell(2).value = 'Date'
  row2.getCell(3).value = 'Event Name'
  row2.getCell(4).value = 'Hours'
  for (let i = 0; i < volCount; i++) row2.getCell(volStartCol + i).value = vols[i].last_name
  styleRow(row2, BOLD_FONT)
  for (let c = 1; c <= 4; c++) row2.getCell(c).fill = LIGHT_BLUE_FILL

  // ─── Row 3: Gender row ──────────────────────────────────────
  const row3 = ws.getRow(3)
  row3.height = 18
  row3.getCell(1).value = '$'
  for (let i = 0; i < volCount; i++) {
    const g = vols[i].gender
    row3.getCell(volStartCol + i).value = g === 'M' ? 'Male' : g === 'F' ? 'Female' : ''
  }
  styleRow(row3, BASE_FONT)

  // ─── Event sections ─────────────────────────────────────────
  let currentRow = 4

  // Track row ranges per section for TOTAL/summary formulas
  // { firstEventRow, lastEventRow, totalRow }
  const sectionRowInfo = new Map<string, { firstEventRow: number; lastEventRow: number; totalRow: number }>()

  for (const section of SECTION_ORDER) {
    const sectionEvents = eventsBySection.get(section) || []

    // Section header row (purple)
    const headerRow = ws.getRow(currentRow)
    headerRow.height = 18
    headerRow.getCell(3).value = section
    for (let c = 1; c <= totalCols; c++) {
      headerRow.getCell(c).fill = PURPLE_FILL
      headerRow.getCell(c).font = WHITE_BOLD
      headerRow.getCell(c).alignment = CENTER_ALIGN
    }
    headerRow.getCell(1).border = { left: MEDIUM_BORDER }
    headerRow.getCell(4).border = { right: MEDIUM_BORDER }
    currentRow++

    const firstEventRow = currentRow

    // Event data rows
    for (const evt of sectionEvents) {
      const r = currentRow
      const row = ws.getRow(r)
      row.height = 18
      row.getCell(2).value = new Date(evt.start_date)
      row.getCell(2).numFmt = 'm/d/yyyy'
      row.getCell(3).value = evt.event_name
      row.getCell(4).value = Number(evt.declared_hours)

      const volHours: number[] = []
      for (let i = 0; i < volCount; i++) {
        const key = `${evt.id}|${vols[i].id}`
        const h = partMap.get(key) || 0
        volHours.push(h)
        if (h > 0) {
          row.getCell(volStartCol + i).value = h
          sectionTotals.get(section)![i] += h
        }
      }

      // Count/Male/Female as formulas
      setCountFormulas(row, r, volHours)

      styleRow(row, BASE_FONT)
      currentRow++
    }

    const lastEventRow = currentRow - 1

    // Blank row before TOTAL
    currentRow++

    // Section TOTAL row — all values as SUM formulas
    const totalRowNum = currentRow
    const totalRow = ws.getRow(totalRowNum)
    totalRow.height = 18
    totalRow.getCell(3).value = 'TOTAL'

    // Hours col (D) = SUM of declared hours in the event rows
    const declaredSum = sectionEvents.reduce((a, e) => a + Number(e.declared_hours), 0)
    totalRow.getCell(4).value = formulaCell(
      `SUM(D${firstEventRow}:D${lastEventRow})`, declaredSum
    )

    // Per-volunteer columns = SUM formula
    const totals = sectionTotals.get(section)!
    for (let i = 0; i < volCount; i++) {
      const cl = colLetter(volStartCol + i)
      totalRow.getCell(volStartCol + i).value = formulaCell(
        `SUM(${cl}${firstEventRow}:${cl}${lastEventRow})`, totals[i]
      )
    }
    styleRow(totalRow, BOLD_FONT)

    sectionRowInfo.set(section, { firstEventRow, lastEventRow, totalRow: totalRowNum })
    currentRow++

    // Blank row after section
    currentRow++
  }

  // ─── Summary section ────────────────────────────────────────
  currentRow++ // extra blank

  const ab1Info = sectionRowInfo.get('Area Based - 1')!
  const ab2Info = sectionRowInfo.get('Area Based - 2')!
  const uniInfo = sectionRowInfo.get('University Based')!
  const colInfo = sectionRowInfo.get('College Based')!

  const ab1 = sectionTotals.get('Area Based - 1')!
  const ab2 = sectionTotals.get('Area Based - 2')!
  const uni = sectionTotals.get('University Based')!
  const col = sectionTotals.get('College Based')!

  const ab1DeclaredSum = (eventsBySection.get('Area Based - 1') || []).reduce((a, e) => a + Number(e.declared_hours), 0)
  const ab2DeclaredSum = (eventsBySection.get('Area Based - 2') || []).reduce((a, e) => a + Number(e.declared_hours), 0)
  const uniDeclaredSum = (eventsBySection.get('University Based') || []).reduce((a, e) => a + Number(e.declared_hours), 0)
  const colDeclaredSum = (eventsBySection.get('College Based') || []).reduce((a, e) => a + Number(e.declared_hours), 0)

  // Summary row definitions:
  // 'range' = SUM over event rows directly, 'refs' = SUM of other summary rows
  type SummaryDef = {
    label: string
    declaredSum: number
    perVol: number[]
    tealFill?: boolean
  } & (
    | { type: 'range'; info: { firstEventRow: number; lastEventRow: number } }
    | { type: 'refs'; refRows: number[] }
  )

  const totalAB = ab1.map((v, i) => v + ab2[i])
  const grandTotal = ab1.map((v, i) => v + ab2[i] + uni[i] + col[i])

  // We need to pre-calculate row positions for ref-based rows
  // Each summary row uses currentRow, then currentRow += 2
  const ab1SummaryRow = currentRow
  const ab2SummaryRow = ab1SummaryRow + 2
  const totalABSummaryRow = ab2SummaryRow + 2
  const uniSummaryRow = totalABSummaryRow + 2
  const colSummaryRow = uniSummaryRow + 2

  const summaryDefs: SummaryDef[] = [
    { label: 'Area Based 1 Hours', declaredSum: ab1DeclaredSum, perVol: ab1, type: 'range', info: ab1Info },
    { label: 'Area Based 2 Hours', declaredSum: ab2DeclaredSum, perVol: ab2, type: 'range', info: ab2Info },
    { label: 'Total Area Based (60)', declaredSum: ab1DeclaredSum + ab2DeclaredSum, perVol: totalAB, tealFill: true, type: 'refs', refRows: [ab1SummaryRow, ab2SummaryRow] },
    { label: 'University Hours', declaredSum: uniDeclaredSum, perVol: uni, type: 'range', info: uniInfo },
    { label: 'College Hours', declaredSum: colDeclaredSum, perVol: col, type: 'range', info: colInfo },
    { label: 'Total Hours (120)', declaredSum: ab1DeclaredSum + ab2DeclaredSum + uniDeclaredSum + colDeclaredSum, perVol: grandTotal, type: 'refs', refRows: [totalABSummaryRow, uniSummaryRow, colSummaryRow] },
  ]

  for (const def of summaryDefs) {
    const r = currentRow
    const row = ws.getRow(r)
    row.height = 18
    row.getCell(1).value = 0
    row.getCell(2).value = def.label
    ws.mergeCells(r, 2, r, 3)

    // Hours col (D) formula
    if (def.type === 'range') {
      row.getCell(4).value = formulaCell(
        `SUM(D${def.info.firstEventRow}:D${def.info.lastEventRow})`, def.declaredSum
      )
    } else {
      const refs = def.refRows.map((rr) => `D${rr}`).join(',')
      row.getCell(4).value = formulaCell(`SUM(${refs})`, def.declaredSum)
    }

    // Per-volunteer column formulas
    for (let i = 0; i < volCount; i++) {
      const cl = colLetter(volStartCol + i)
      if (def.type === 'range') {
        row.getCell(volStartCol + i).value = formulaCell(
          `SUM(${cl}${def.info.firstEventRow}:${cl}${def.info.lastEventRow})`, def.perVol[i]
        )
      } else {
        const refs = def.refRows.map((rr) => `${cl}${rr}`).join(',')
        row.getCell(volStartCol + i).value = formulaCell(`SUM(${refs})`, def.perVol[i])
      }
    }

    // Count/Male/Female as formulas
    setCountFormulas(row, r, def.perVol)

    styleRow(row, BOLD_FONT)

    if (def.tealFill) {
      row.getCell(countCol).fill = TEAL_FILL
      row.getCell(maleCol).fill = TEAL_FILL
      row.getCell(femaleCol).fill = TEAL_FILL
    }

    currentRow += 2
  }

  // Write to buffer and return as base64
  const buffer = await wb.xlsx.writeBuffer()
  return Buffer.from(buffer).toString('base64')
}
