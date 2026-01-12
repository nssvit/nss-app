import { pgTable, uuid, boolean, timestamp } from 'drizzle-orm/pg-core'
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
})

export type UserRole = typeof userRoles.$inferSelect
export type NewUserRole = typeof userRoles.$inferInsert
