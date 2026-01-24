import { pgTable, uuid, text, boolean, timestamp, integer, index, uniqueIndex, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { events } from './events'
import { volunteers } from './volunteers'

export const eventParticipation = pgTable('event_participation', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  volunteerId: uuid('volunteer_id').notNull().references(() => volunteers.id, { onDelete: 'cascade' }),
  hoursAttended: integer('hours_attended').notNull().default(0),
  declaredHours: integer('declared_hours').default(0),
  approvedHours: integer('approved_hours'),
  participationStatus: text('participation_status').notNull().default('registered'),
  registrationDate: timestamp('registration_date', { withTimezone: true }).defaultNow(),
  attendanceDate: timestamp('attendance_date', { withTimezone: true }),
  notes: text('notes'),
  feedback: text('feedback'),
  recordedByVolunteerId: uuid('recorded_by_volunteer_id').references(() => volunteers.id, { onDelete: 'set null' }),
  // Hours approval workflow
  approvalStatus: text('approval_status').notNull().default('pending'),
  approvedBy: uuid('approved_by').references(() => volunteers.id, { onDelete: 'set null' }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  approvalNotes: text('approval_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  // Indexes for performance
  index('idx_participation_event').on(table.eventId),
  index('idx_participation_volunteer').on(table.volunteerId),
  index('idx_participation_status').on(table.participationStatus),
  index('idx_participation_approval_status').on(table.approvalStatus),
  index('idx_participation_approved_by').on(table.approvedBy),

  // Unique constraint: one participation per volunteer per event
  uniqueIndex('idx_participation_unique').on(table.eventId, table.volunteerId),

  // Check constraints for data validation
  check('participation_status_check', sql`${table.participationStatus} IN ('registered', 'present', 'absent', 'partially_present', 'excused')`),
  check('participation_approval_status_check', sql`${table.approvalStatus} IN ('pending', 'approved', 'rejected')`),
  check('participation_hours_check', sql`${table.hoursAttended} >= 0 AND ${table.hoursAttended} <= 24`),
  check('participation_approved_hours_check', sql`${table.approvedHours} IS NULL OR (${table.approvedHours} >= 0 AND ${table.approvedHours} <= 24)`),
])

export type EventParticipation = typeof eventParticipation.$inferSelect
export type NewEventParticipation = typeof eventParticipation.$inferInsert
