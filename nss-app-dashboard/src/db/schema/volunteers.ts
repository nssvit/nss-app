import { pgTable, uuid, text, boolean, timestamp, date, integer } from 'drizzle-orm/pg-core'

export const volunteers = pgTable('volunteers', {
  id: uuid('id').primaryKey().defaultRandom(),
  authUserId: uuid('auth_user_id').unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  rollNumber: text('roll_number').notNull().unique(),
  email: text('email').notNull().unique(), // citext at DB level
  branch: text('branch').notNull(), // EXCS, CMPN, IT, BIO-MED, EXTC
  year: text('year').notNull(), // FE, SE, TE
  phoneNo: text('phone_no'),
  birthDate: date('birth_date'),
  gender: text('gender'), // M, F, Prefer not to say
  nssJoinYear: integer('nss_join_year'),
  address: text('address'),
  profilePic: text('profile_pic'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Volunteer = typeof volunteers.$inferSelect
export type NewVolunteer = typeof volunteers.$inferInsert
