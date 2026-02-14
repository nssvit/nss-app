/**
 * Incremental CSV Data Ingestion
 *
 * Reads the NSS Hours CSV and syncs to Postgres:
 *   - New volunteers   → inserted (auth_user_id = NULL)
 *   - Existing volunteers → skipped (preserves auth_user_id)
 *   - New events        → inserted
 *   - Existing events   → skipped
 *   - New participation → inserted
 *   - Changed hours     → updated
 *
 * Safe to run multiple times — only processes the delta.
 *
 * Usage: npm run csv:seed
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { readFileSync } from 'fs'
import { resolve } from 'path'
import postgres from 'postgres'

// ─── Config ──────────────────────────────────────────────────────
const CSV_PATH = resolve(__dirname, '../../../NSS Hours 25-26(2025-2026).csv')
const VOL_START = 4 // volunteer data starts at column index 4
const SE_COUNT = 45
const TOTAL_VOLUNTEERS = 115
const EMAIL_DOMAIN = 'vit.edu.in'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL not set. Add it to .env.local')
}

const db = postgres(process.env.DATABASE_URL, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
})

// ─── CSV Parsing ─────────────────────────────────────────────────
function parseCSV(filePath: string): string[][] {
  return readFileSync(filePath, 'utf-8')
    .split('\n')
    .map((line) => line.split(',').map((c) => c.trim()))
}

function parseDate(raw: string): Date | null {
  if (!raw) return null
  const s = raw.split(' to ')[0].trim()

  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (us) return new Date(+us[3], +us[1] - 1, +us[2], 9, 0, 0)

  const eu = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (eu) return new Date(+eu[3], +eu[2] - 1, +eu[1], 9, 0, 0)

  return null
}

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s
}

function eventKey(name: string, date: Date): string {
  return `${name.toLowerCase().trim()}|${date.toISOString().slice(0, 10)}`
}

function makeEmail(first: string, last: string): string {
  const f = first.toLowerCase().replace(/[^a-z]/g, '')
  const l = (last || 'nss').toLowerCase().replace(/[^a-z]/g, '')
  return `${f}.${l}@${EMAIL_DOMAIN}`
}

// ─── Section → Category Code Mapping ─────────────────────────────
const SECTION_TO_CATEGORY: Record<string, string> = {
  'Area Based - 1': 'area-based-1',
  'Area Based - 2': 'area-based-2',
  'University Based': 'university-based',
  'College Based': 'college-based',
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('📊 NSS CSV Sync\n')

  // ── 1. Parse CSV ───────────────────────────────────────────────
  const rows = parseCSV(CSV_PATH)
  console.log(`CSV: ${rows.length} rows\n`)

  // Extract volunteer info
  const firstNames = rows[0].slice(VOL_START)
  const lastNames = rows[1].slice(VOL_START)
  const genders = rows[2].slice(VOL_START)

  interface Vol {
    firstName: string
    lastName: string
    email: string
    gender: 'M' | 'F' | null
    year: 'SE' | 'TE'
    col: number
  }

  const csvVolunteers: Vol[] = []
  for (let i = 0; i < TOTAL_VOLUNTEERS; i++) {
    const fn = cap(firstNames[i] || '')
    if (!fn || fn === 'Count' || fn === 'Male' || fn === 'Female') break
    const ln = cap(lastNames[i] || '')
    csvVolunteers.push({
      firstName: fn,
      lastName: ln,
      email: makeEmail(fn, ln),
      gender: genders[i] === 'Male' ? 'M' : genders[i] === 'Female' ? 'F' : null,
      year: i < SE_COUNT ? 'SE' : 'TE',
      col: VOL_START + i,
    })
  }

  // Extract events
  const sectionHeaders = ['Area Based - 1', 'Area Based - 2', 'University Based', 'College Based']

  interface Evt {
    name: string
    date: Date
    hours: number
    row: number
    section: string
  }

  const csvEvents: Evt[] = []
  let curSection = ''

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]
    if (row[2] && sectionHeaders.includes(row[2])) {
      curSection = row[2]
      continue
    }
    if (row[2] === 'TOTAL') {
      curSection = ''
      continue
    }
    if (!curSection || !row[1] || !row[2] || !row[3]) continue
    const date = parseDate(row[1])
    const hours = parseInt(row[3])
    if (!date || isNaN(hours) || hours <= 0) continue
    if (row[2] === 'Event Name') continue

    csvEvents.push({ name: row[2], date, hours, row: r, section: curSection })
  }

  const seCount = csvVolunteers.filter((v) => v.year === 'SE').length
  const teCount = csvVolunteers.filter((v) => v.year === 'TE').length
  console.log(`Parsed: ${csvVolunteers.length} volunteers (${seCount} SE, ${teCount} TE)`)
  console.log(`Parsed: ${csvEvents.length} events\n`)

  // ── 2. Fetch existing DB state ─────────────────────────────────
  console.log('Fetching existing DB state...')

  const dbCategories = await db`SELECT id, code FROM event_categories WHERE is_active = true`
  const catByCode = new Map<string, number>()
  for (const c of dbCategories) catByCode.set(c.code as string, c.id as number)

  if (catByCode.size === 0) {
    console.error('No categories found! Run "npm run db:setup" first.')
    process.exit(1)
  }

  const dbVolunteers = await db`SELECT id, email FROM volunteers`
  const volByEmail = new Map<string, string>()
  for (const v of dbVolunteers) volByEmail.set(v.email as string, v.id as string)

  const dbEvents =
    await db`SELECT id, lower(event_name) as name, start_date FROM events WHERE is_active = true`
  const evtByKey = new Map<string, string>()
  for (const e of dbEvents) {
    const d = new Date(e.start_date as string)
    evtByKey.set(eventKey(e.name as string, d), e.id as string)
  }

  const dbParticipation = await db`SELECT event_id, volunteer_id, hours_attended FROM event_participation`
  const partKey = (eid: string, vid: string) => `${eid}|${vid}`
  const partMap = new Map<string, number>()
  for (const p of dbParticipation) {
    partMap.set(partKey(p.event_id as string, p.volunteer_id as string), p.hours_attended as number)
  }

  console.log(
    `  DB has: ${volByEmail.size} volunteers, ${evtByKey.size} events, ${partMap.size} participation records\n`
  )

  // ── 3. Sync volunteers ─────────────────────────────────────────
  console.log('Syncing volunteers...')
  let volNew = 0
  let volSkipped = 0

  // Resolve col → volunteer ID for participation linking
  const colToId = new Map<number, string>()

  // Handle duplicate emails in CSV (same first+last name)
  const emailCounts = new Map<string, number>()
  const resolvedEmails: string[] = []
  for (const v of csvVolunteers) {
    let email = v.email
    const count = emailCounts.get(email) || 0
    if (count > 0) {
      email = email.replace(`@${EMAIL_DOMAIN}`, `${count + 1}@${EMAIL_DOMAIN}`)
    }
    emailCounts.set(v.email, count + 1)
    resolvedEmails.push(email)
  }

  for (let i = 0; i < csvVolunteers.length; i++) {
    const v = csvVolunteers[i]
    const email = resolvedEmails[i]

    const existing = volByEmail.get(email)
    if (existing) {
      colToId.set(v.col, existing)
      volSkipped++
      continue
    }

    // Generate unique roll number
    const roll = `NSS2526${v.year}${String(i + 1).padStart(3, '0')}`

    try {
      const [row] = await db`
        INSERT INTO volunteers (
          first_name, last_name, roll_number, email,
          branch, year, gender, nss_join_year, is_active
        ) VALUES (
          ${v.firstName}, ${v.lastName}, ${roll}, ${email},
          'CMPN', ${v.year}, ${v.gender}, 2025, true
        )
        ON CONFLICT (email) DO NOTHING
        RETURNING id
      `
      if (row) {
        colToId.set(v.col, row.id as string)
        volByEmail.set(email, row.id as string)
        volNew++
      } else {
        // email conflict from a previous run with different roll - fetch existing
        const [existing] = await db`SELECT id FROM volunteers WHERE email = ${email}`
        if (existing) colToId.set(v.col, existing.id as string)
        volSkipped++
      }
    } catch {
      // roll_number conflict — retry with unique suffix
      const uniqueRoll = `${roll}X${Date.now().toString(36).slice(-3)}`
      try {
        const [row] = await db`
          INSERT INTO volunteers (
            first_name, last_name, roll_number, email,
            branch, year, gender, nss_join_year, is_active
          ) VALUES (
            ${v.firstName}, ${v.lastName}, ${uniqueRoll}, ${email},
            'CMPN', ${v.year}, ${v.gender}, 2025, true
          )
          ON CONFLICT (email) DO NOTHING
          RETURNING id
        `
        if (row) {
          colToId.set(v.col, row.id as string)
          volByEmail.set(email, row.id as string)
          volNew++
        }
      } catch (e) {
        console.warn(`  Skip: ${v.firstName} ${v.lastName} — ${(e as Error).message}`)
      }
    }
  }

  console.log(`  New: ${volNew} | Existing: ${volSkipped}\n`)

  // Find creator (Harshal More or first volunteer)
  let creatorId = ''
  for (let i = 0; i < csvVolunteers.length; i++) {
    if (csvVolunteers[i].firstName === 'Harshal' && csvVolunteers[i].lastName === 'More') {
      creatorId = colToId.get(csvVolunteers[i].col) || ''
      break
    }
  }
  if (!creatorId) {
    const ids = Array.from(colToId.values())
    creatorId = ids[0]
  }

  // ── 4. Sync events ────────────────────────────────────────────
  console.log('Syncing events...')
  let evtNew = 0
  let evtSkipped = 0

  // event row index → event UUID
  const rowToEventId = new Map<number, string>()

  for (const evt of csvEvents) {
    const key = eventKey(evt.name, evt.date)
    const existingId = evtByKey.get(key)

    if (existingId) {
      rowToEventId.set(evt.row, existingId)
      evtSkipped++
      continue
    }

    const catCode = SECTION_TO_CATEGORY[evt.section]
    if (!catCode) {
      console.warn(`  Unknown section "${evt.section}" for "${evt.name}"`)
      continue
    }
    const catId = catByCode.get(catCode)
    if (!catId) {
      console.warn(`  No category for section "${evt.section}" [${catCode}]`)
      continue
    }

    const endDate = new Date(evt.date)
    endDate.setHours(endDate.getHours() + evt.hours)

    try {
      const [row] = await db`
        INSERT INTO events (
          event_name, description, start_date, end_date,
          declared_hours, category_id, event_status,
          location, created_by_volunteer_id, is_active
        ) VALUES (
          ${evt.name}, ${evt.section + ' — ' + evt.name},
          ${evt.date.toISOString()}, ${endDate.toISOString()},
          ${evt.hours}, ${catId}, 'completed',
          'Mumbai', ${creatorId}, true
        )
        RETURNING id
      `
      rowToEventId.set(evt.row, row.id as string)
      evtByKey.set(key, row.id as string)
      evtNew++
      console.log(`  + ${evt.name} (${evt.date.toLocaleDateString()}) [${evt.section}]`)
    } catch (e) {
      console.warn(`  Failed: ${evt.name} — ${(e as Error).message}`)
    }
  }

  console.log(`  New: ${evtNew} | Existing: ${evtSkipped}\n`)

  // ── 5. Sync participation ──────────────────────────────────────
  console.log('Syncing participation...')
  let partNew = 0
  let partUpdated = 0
  let partSkipped = 0

  for (const evt of csvEvents) {
    const eventId = rowToEventId.get(evt.row)
    if (!eventId) continue

    const row = rows[evt.row]

    for (let vi = 0; vi < csvVolunteers.length; vi++) {
      const col = csvVolunteers[vi].col
      const cell = row[col]
      if (!cell) continue

      const hours = parseInt(cell)
      if (isNaN(hours) || hours <= 0) continue

      const volunteerId = colToId.get(col)
      if (!volunteerId) continue

      const pk = partKey(eventId, volunteerId)
      const existingHours = partMap.get(pk)

      if (existingHours !== undefined) {
        if (existingHours !== hours) {
          // Hours changed — update
          await db`
            UPDATE event_participation
            SET hours_attended = ${hours},
                approved_hours = ${hours},
                updated_at = now()
            WHERE event_id = ${eventId} AND volunteer_id = ${volunteerId}
          `
          partUpdated++
        } else {
          partSkipped++
        }
        continue
      }

      // New participation
      try {
        await db`
          INSERT INTO event_participation (
            event_id, volunteer_id, hours_attended, approved_hours,
            participation_status, approval_status,
            approved_by, approved_at,
            attendance_date, registration_date
          ) VALUES (
            ${eventId}, ${volunteerId}, ${hours}, ${hours},
            'present', 'approved',
            ${creatorId}, ${evt.date.toISOString()},
            ${evt.date.toISOString()}, ${evt.date.toISOString()}
          )
          ON CONFLICT (event_id, volunteer_id) DO NOTHING
        `
        partNew++
      } catch (e) {
        console.warn(`  Part skip: event=${eventId} vol=${volunteerId} — ${(e as Error).message}`)
      }
    }
  }

  console.log(`  New: ${partNew} | Updated: ${partUpdated} | Unchanged: ${partSkipped}\n`)

  // ── Summary ────────────────────────────────────────────────────
  console.log('='.repeat(50))
  console.log('  Volunteers : +' + volNew + ' new, ' + volSkipped + ' existing')
  console.log('  Events     : +' + evtNew + ' new, ' + evtSkipped + ' existing')
  console.log(
    '  Attendance : +' + partNew + ' new, ' + partUpdated + ' updated, ' + partSkipped + ' unchanged'
  )
  console.log('='.repeat(50))

  if (volNew + evtNew + partNew + partUpdated === 0) {
    console.log('\nNothing to do — database is already up to date.')
  } else {
    console.log('\nSync complete.')
  }

  console.log()
  await db.end()
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nSeed failed:', err)
    process.exit(1)
  })
