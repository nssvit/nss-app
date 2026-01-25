import { pgTable, serial, text, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'

export const eventCategories = pgTable(
  'event_categories',
  {
    id: serial('id').primaryKey(),
    categoryName: text('category_name').notNull().unique(),
    code: text('code').notNull().unique(),
    description: text('description'),
    colorHex: text('color_hex').default('#6366F1'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Indexes for performance
    index('idx_categories_active').on(table.isActive),
    index('idx_categories_code').on(table.code),
  ]
)

export type EventCategory = typeof eventCategories.$inferSelect
export type NewEventCategory = typeof eventCategories.$inferInsert
