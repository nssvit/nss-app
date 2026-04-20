/**
 * Tenure helpers - request-scoped current-tenure lookup.
 *
 * Every query that reads tenure-scoped data (events, participations) should
 * filter by `getCurrentTenureId()` by default. Past tenures are opt-in.
 */

import { cache } from 'react'
import { eq } from 'drizzle-orm'
import { db, withRetry } from '@/db'
import { tenures, type Tenure } from '@/db/schema/tenures'

export const getCurrentTenure = cache(async (): Promise<Tenure> => {
  const [row] = await withRetry(() =>
    db.select().from(tenures).where(eq(tenures.isCurrent, true)).limit(1)
  )
  if (!row) {
    throw new Error('No current tenure configured. An admin must create one.')
  }
  return row
})

export const getCurrentTenureId = cache(async (): Promise<string> => {
  const t = await getCurrentTenure()
  return t.id
})
