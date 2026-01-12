import { pgTable, serial, text, boolean, timestamp } from 'drizzle-orm/pg-core'

export const eventCategories = pgTable('event_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  categoryName: text('category_name').notNull(),
  code: text('code').notNull().unique(),
  description: text('description'),
  colorHex: text('color_hex'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type EventCategory = typeof eventCategories.$inferSelect
export type NewEventCategory = typeof eventCategories.$inferInsert
