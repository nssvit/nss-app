import { sql } from 'drizzle-orm'
import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  date,
  integer,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core'

export const volunteers = pgTable(
  'volunteers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authUserId: uuid('auth_user_id').unique(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    rollNumber: text('roll_number').notNull().unique(),
    email: text('email').notNull().unique(),
    branch: text('branch').notNull(),
    year: text('year').notNull(),
    phoneNo: text('phone_no'),
    birthDate: date('birth_date'),
    gender: text('gender'),
    nssJoinYear: integer('nss_join_year'),
    address: text('address'),
    profilePic: text('profile_pic'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Indexes for performance
    index('idx_volunteers_auth_user').on(table.authUserId),
    index('idx_volunteers_branch').on(table.branch),
    index('idx_volunteers_year').on(table.year),
    index('idx_volunteers_active').on(table.isActive),
    index('idx_volunteers_email').on(table.email),
    index('idx_volunteers_roll_number').on(table.rollNumber),

    // Check constraints for data validation
    check(
      'volunteers_branch_check',
      sql`${table.branch} IN ('EXCS', 'CMPN', 'IT', 'BIO-MED', 'EXTC')`
    ),
    check('volunteers_year_check', sql`${table.year} IN ('FE', 'SE', 'TE')`),
    check(
      'volunteers_gender_check',
      sql`${table.gender} IS NULL OR ${table.gender} IN ('M', 'F', 'Prefer not to say')`
    ),
  ]
)

export type Volunteer = typeof volunteers.$inferSelect
export type NewVolunteer = typeof volunteers.$inferInsert
