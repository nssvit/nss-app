import { pgTable, uuid, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { volunteers } from './volunteers'
import { roleDefinitions } from './roleDefinitions'

export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  volunteerId: uuid('volunteer_id').notNull().references(() => volunteers.id, { onDelete: 'cascade' }),
  roleDefinitionId: uuid('role_definition_id').notNull().references(() => roleDefinitions.id, { onDelete: 'cascade' }),
  assignedBy: uuid('assigned_by').references(() => volunteers.id, { onDelete: 'set null' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  // Indexes for performance
  index('idx_user_roles_volunteer').on(table.volunteerId),
  index('idx_user_roles_role').on(table.roleDefinitionId),
  index('idx_user_roles_active').on(table.isActive),
  index('idx_user_roles_assigned_by').on(table.assignedBy),

  // Unique constraint: one active role assignment per volunteer per role
  uniqueIndex('idx_user_roles_unique').on(table.volunteerId, table.roleDefinitionId),
])

export type UserRole = typeof userRoles.$inferSelect
export type NewUserRole = typeof userRoles.$inferInsert
