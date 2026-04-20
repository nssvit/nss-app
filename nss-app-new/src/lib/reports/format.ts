export interface ReportAttendee {
  first_name: string
  last_name: string
  gender: string | null
  year: string
  branch: string
  roll_number: string
  hours_attended: number
  participation_status: string
}

export interface ReportHeader {
  event_name: string
  description: string | null
  start_date: string | Date
  end_date: string | Date
  location: string | null
  category_name: string | null
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function ordinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}

/** e.g. "Saturday, 15th March 2026" */
export function formatFullDate(d: Date): string {
  return `${WEEKDAYS[d.getDay()]}, ${ordinal(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** e.g. "9:30 am" */
function formatTime(d: Date): string {
  let h = d.getHours()
  const m = d.getMinutes()
  const ampm = h >= 12 ? 'pm' : 'am'
  h = h % 12
  if (h === 0) h = 12
  return m === 0 ? `${h} ${ampm}` : `${h}:${m.toString().padStart(2, '0')} ${ampm}`
}

/** e.g. "9:30 am to 1:00 pm" */
export function formatTimeRange(start: Date, end: Date): string {
  return `${formatTime(start)} to ${formatTime(end)}`
}

function genderLabel(g: string | null): 'Male' | 'Female' | 'Other' {
  if (g === 'M') return 'Male'
  if (g === 'F') return 'Female'
  return 'Other'
}

export interface GenderStats {
  total: number
  male: number
  female: number
  other: number
}

export function computeGenderStats(attendees: ReportAttendee[]): GenderStats {
  let male = 0
  let female = 0
  let other = 0
  for (const a of attendees) {
    const g = genderLabel(a.gender)
    if (g === 'Male') male++
    else if (g === 'Female') female++
    else other++
  }
  return { total: attendees.length, male, female, other }
}

/**
 * Build the pre-formatted event data block that gets passed to Gemini.
 * Mirrors the WhatsApp-style input the prompt is tuned for.
 */
export function formatEventDataForLLM(header: ReportHeader, attendees: ReportAttendee[]): string {
  const start = new Date(header.start_date)
  const end = new Date(header.end_date)
  const stats = computeGenderStats(attendees)

  const roster = attendees
    .map((a, i) => {
      const name = `${a.first_name} ${a.last_name}`
      const g = genderLabel(a.gender)
      return `${i + 1}. ${name} (${g}) — ${a.year} ${a.branch}`
    })
    .join('\n')

  return [
    `Event Name: ${header.event_name}`,
    `Location: ${header.location ?? 'N/A'}`,
    `Date: ${formatFullDate(start)}`,
    `Time: ${formatTimeRange(start, end)}`,
    `Number of Volunteers: ${stats.total} (Male: ${stats.male}, Female: ${stats.female})`,
    header.category_name ? `Category: ${header.category_name}` : '',
    '',
    'Names of Attendees:',
    roster || '(none present)',
  ]
    .filter(Boolean)
    .join('\n')
}
