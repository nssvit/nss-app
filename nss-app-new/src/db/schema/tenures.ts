import { sql } from 'drizzle-orm'
import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  date,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core'

export const tenures = pgTable(
  'tenures',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    label: text('label').notNull().unique(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    isCurrent: boolean('is_current').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_tenures_only_one_current')
      .on(table.isCurrent)
      .where(sql`${table.isCurrent} = true`),
    index('idx_tenures_start_date').on(table.startDate),
    check('tenures_label_format_check', sql`${table.label} ~ '^[0-9]{4}-[0-9]{4}$'`),
    check(
      'tenures_dates_check',
      sql`${table.endDate} IS NULL OR ${table.endDate} >= ${table.startDate}`
    ),
  ]
)

export type Tenure = typeof tenures.$inferSelect
export type NewTenure = typeof tenures.$inferInsert
