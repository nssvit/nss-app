import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'

const TEMPLATE_PATH = join(process.cwd(), 'src', 'lib', 'reports', 'templates', 'nss-report.docx')

let cachedTemplate: Buffer | null = null

async function loadTemplate(): Promise<Buffer> {
  if (cachedTemplate) return cachedTemplate
  cachedTemplate = await readFile(TEMPLATE_PATH)
  return cachedTemplate
}

export interface ParsedNssMarkdown {
  eventDetails: Record<string, string>
  objectives: string[]
  description: string
  impact: string
  conclusion: string
  activityTitle: string
}

/** Parse the markdown output from Gemini into structured pieces. */
export function parseNssMarkdown(md: string): ParsedNssMarkdown {
  const eventDetails: Record<string, string> = {}
  let objectives: string[] = []
  let description = ''
  let impact = ''
  let conclusion = ''
  let activityTitle = ''

  // --- Event details table: lines of form "| key | value |" ---
  const tableRowRe = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/gm
  let m: RegExpExecArray | null
  while ((m = tableRowRe.exec(md)) !== null) {
    const key = m[1].trim()
    const value = m[2].trim()
    // Skip separator rows like "|------|------|"
    if (/^[-:\s|]+$/.test(key) || /^[-:\s|]+$/.test(value)) continue
    eventDetails[key] = value
  }
  activityTitle = eventDetails['Activity Title'] ?? ''

  // --- Sections: "#### NAME" blocks. Match up to next "####" or end of input. ---
  const sectionRe = /^####\s+([A-Z ][A-Z ]*?)\s*$([\s\S]*?)(?=^####\s|$(?![\s\S]))/gm
  let sec: RegExpExecArray | null
  while ((sec = sectionRe.exec(md)) !== null) {
    const name = sec[1].trim().toUpperCase()
    const body = sec[2].trim()
    if (name === 'EVENT DETAILS') continue // already captured from table
    if (name === 'OBJECTIVES') {
      objectives = body
        .split('\n')
        .map((l) => l.replace(/^\s*[-*]\s+/, '').trim())
        .filter((l) => l.length > 0 && !/^#{1,6}\s/.test(l))
    } else if (name === 'DESCRIPTION') {
      description = body
    } else if (name === 'IMPACT') {
      impact = body
    } else if (name === 'CONCLUSION') {
      conclusion = body
    }
  }

  return { eventDetails, objectives, description, impact, conclusion, activityTitle }
}

/** Slugify a string for use in a filename. */
function slugifyForFile(s: string): string {
  return s
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '_')
}

/**
 * Produce "DD-MM-YYYY_EventTitle_Report.docx" from the parsed data.
 * Falls back to provided startDate if the LLM's Date string can't be parsed.
 */
export function buildReportFilename(parsed: ParsedNssMarkdown, fallbackStart: Date): string {
  const title = slugifyForFile(parsed.activityTitle || 'NSS_Report')
  const dateStr = parsed.eventDetails['Date']
  let dd = fallbackStart.getDate().toString().padStart(2, '0')
  let mm = (fallbackStart.getMonth() + 1).toString().padStart(2, '0')
  let yyyy = fallbackStart.getFullYear().toString()

  if (dateStr) {
    // Try "Saturday, 15th March 2026" style — strip weekday + ordinal suffix
    const cleaned = dateStr.replace(/^[A-Za-z]+,\s*/, '').replace(/(\d+)(st|nd|rd|th)/i, '$1')
    const parsedDate = new Date(cleaned)
    if (!Number.isNaN(parsedDate.getTime())) {
      dd = parsedDate.getDate().toString().padStart(2, '0')
      mm = (parsedDate.getMonth() + 1).toString().padStart(2, '0')
      yyyy = parsedDate.getFullYear().toString()
    }
  }

  return `${dd}-${mm}-${yyyy}_${title}_Report.docx`
}

export interface FillTemplateInput {
  activityTitle: string
  date: string
  venue: string
  time: string
  volunteers: string
  activityCoordinator: string
  scheme: string
  organizingUnit: string
  objectives: string[]
  description: string
  impact: string
  conclusion: string
}

/** Fill the NSS template.docx with structured values. Returns a Buffer. */
export async function fillNssReportTemplate(input: FillTemplateInput): Promise<Buffer> {
  const template = await loadTemplate()
  const zip = new PizZip(template)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => '',
  })

  const objectivesText = input.objectives.map((o) => `• ${o}`).join('\n')

  doc.render({
    activityTitle: input.activityTitle,
    date: input.date,
    venue: input.venue,
    time: input.time,
    volunteers: input.volunteers,
    activityCoordinator: input.activityCoordinator,
    scheme: input.scheme,
    organizingUnit: input.organizingUnit,
    in_points: objectivesText,
    description: input.description,
    impact: input.impact,
    conclusion: input.conclusion,
    insert_photos: '',
  })

  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' })
}
