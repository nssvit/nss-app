import { pgTable, uuid, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core'
import { events } from './events'
import { volunteers } from './volunteers'

export const eventParticipation = pgTable('event_participation', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  volunteerId: uuid('volunteer_id').notNull().references(() => volunteers.id, { onDelete: 'cascade' }),
  hoursAttended: integer('hours_attended').notNull().default(0),
  declaredHours: integer('declared_hours').default(0),
  approvedHours: integer('approved_hours'),
  participationStatus: text('participation_status').notNull().default('registered'), // registered, present, absent, partially_present, excused
  registrationDate: timestamp('registration_date', { withTimezone: true }).defaultNow(),
  attendanceDate: timestamp('attendance_date', { withTimezone: true }),
  notes: text('notes'),
  feedback: text('feedback'),
  recordedByVolunteerId: uuid('recorded_by_volunteer_id').references(() => volunteers.id, { onDelete: 'restrict' }),
  // Hours approval workflow
  approvalStatus: text('approval_status').notNull().default('pending'), // pending, approved, rejected
  approvedBy: uuid('approved_by').references(() => volunteers.id, { onDelete: 'set null' }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  approvalNotes: text('approval_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type EventParticipation = typeof eventParticipation.$inferSelect
export type NewEventParticipation = typeof eventParticipation.$inferInsert
