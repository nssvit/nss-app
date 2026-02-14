import { sql } from 'drizzle-orm'
import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  index,
  check,
} from 'drizzle-orm/pg-core'

export const roleDefinitions = pgTable(
  'role_definitions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roleName: text('role_name').notNull().unique(),
    displayName: text('display_name').notNull(),
    description: text('description'),
    permissions: jsonb('permissions').notNull().default({}),
    hierarchyLevel: integer('hierarchy_level').notNull().default(0),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Indexes for performance
    index('idx_roles_active').on(table.isActive),
    index('idx_roles_hierarchy').on(table.hierarchyLevel),

    // Check constraints
    check(
      'role_hierarchy_check',
      sql`${table.hierarchyLevel} >= 0 AND ${table.hierarchyLevel} <= 100`
    ),
  ]
)

export type RoleDefinition = typeof roleDefinitions.$inferSelect
export type NewRoleDefinition = typeof roleDefinitions.$inferInsert
