import { pgTable, uuid, text, boolean, timestamp, date, integer } from 'drizzle-orm/pg-core'
import { eventCategories } from './eventCategories'
import { volunteers } from './volunteers'

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  eventName: text('event_name').notNull(),
  description: text('description'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  eventDate: timestamp('event_date', { withTimezone: true }),
  declaredHours: integer('declared_hours').notNull(),
  categoryId: integer('category_id').notNull().references(() => eventCategories.id),
  minParticipants: integer('min_participants'),
  maxParticipants: integer('max_participants'),
  eventStatus: text('event_status').notNull().default('planned'), // planned, registration_open, registration_closed, ongoing, completed, cancelled
  location: text('location'),
  registrationDeadline: timestamp('registration_deadline', { withTimezone: true }),
  createdByVolunteerId: uuid('created_by_volunteer_id').notNull().references(() => volunteers.id, { onDelete: 'restrict' }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
