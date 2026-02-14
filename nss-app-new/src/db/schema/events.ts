import { sql } from 'drizzle-orm'
import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  index,
  check,
} from 'drizzle-orm/pg-core'
import { eventCategories } from './eventCategories'
import { volunteers } from './volunteers'

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventName: text('event_name').notNull(),
    description: text('description'),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    declaredHours: integer('declared_hours').notNull(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => eventCategories.id),
    minParticipants: integer('min_participants'),
    maxParticipants: integer('max_participants'),
    eventStatus: text('event_status').notNull().default('planned'),
    location: text('location'),
    registrationDeadline: timestamp('registration_deadline', { withTimezone: true }),
    createdByVolunteerId: uuid('created_by_volunteer_id')
      .notNull()
      .references(() => volunteers.id, { onDelete: 'restrict' }),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Indexes for performance
    index('idx_events_category').on(table.categoryId),
    index('idx_events_status').on(table.eventStatus),
    index('idx_events_start_date').on(table.startDate),
    index('idx_events_active').on(table.isActive),
    index('idx_events_created_by').on(table.createdByVolunteerId),

    // Check constraints for data validation
    check('events_dates_check', sql`${table.endDate} >= ${table.startDate}`),
    check('events_hours_check', sql`${table.declaredHours} >= 1 AND ${table.declaredHours} <= 240`),
    check(
      'events_status_check',
      sql`${table.eventStatus} IN ('planned', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled')`
    ),
    check(
      'events_participants_check',
      sql`${table.maxParticipants} IS NULL OR ${table.maxParticipants} >= COALESCE(${table.minParticipants}, 0)`
    ),
  ]
)

export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
