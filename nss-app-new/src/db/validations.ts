import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import {
  volunteers,
  events,
  eventParticipation,
  eventCategories,
  roleDefinitions,
  userRoles,
} from './schema'

// Volunteer Validations

export const insertVolunteerSchema = createInsertSchema(volunteers, {
  email: (schema) => schema.email('Invalid email format'),
  firstName: (schema) => schema.min(1, 'First name is required').max(100),
  lastName: (schema) => schema.min(1, 'Last name is required').max(100),
  rollNumber: (schema) => schema.min(1, 'Roll number is required').max(20),
  branch: () => z.enum(['EXCS', 'CMPN', 'IT', 'BIO-MED', 'EXTC'], { message: 'Invalid branch' }),
  year: () => z.enum(['FE', 'SE', 'TE'], { message: 'Invalid year' }),
  phoneNo: (schema) =>
    schema
      .regex(/^[0-9]{10}$/, 'Phone number must be 10 digits')
      .optional()
      .nullable(),
  gender: () => z.enum(['M', 'F', 'Prefer not to say']).optional().nullable(),
})

export const updateVolunteerSchema = insertVolunteerSchema.partial()
export const selectVolunteerSchema = createSelectSchema(volunteers)

// Event Validations

export const insertEventSchema = createInsertSchema(events, {
  eventName: (schema) => schema.min(1, 'Event name is required').max(200),
  description: (schema) => schema.max(2000).optional().nullable(),
  startDate: () => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD format'),
  endDate: () => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD format'),
  declaredHours: () => z.number().int().min(0).max(100),
  minParticipants: () => z.number().int().min(0).optional().nullable(),
  maxParticipants: () => z.number().int().min(1).optional().nullable(),
  eventStatus: () =>
    z.enum([
      'planned',
      'registration_open',
      'registration_closed',
      'ongoing',
      'completed',
      'cancelled',
    ]),
  location: (schema) => schema.max(500).optional().nullable(),
})

export const updateEventSchema = insertEventSchema.partial()
export const selectEventSchema = createSelectSchema(events)

// Event Participation Validations

export const insertEventParticipationSchema = createInsertSchema(eventParticipation, {
  hoursAttended: () => z.number().int().min(0).max(24).default(0),
  declaredHours: () => z.number().int().min(0).max(24).optional().nullable(),
  participationStatus: () =>
    z
      .enum(['registered', 'present', 'absent', 'partially_present', 'excused'])
      .default('registered'),
  approvalStatus: () => z.enum(['pending', 'approved', 'rejected']).default('pending'),
  notes: (schema) => schema.max(1000).optional().nullable(),
  feedback: (schema) => schema.max(2000).optional().nullable(),
})

export const updateEventParticipationSchema = insertEventParticipationSchema.partial()
export const selectEventParticipationSchema = createSelectSchema(eventParticipation)

// Event Category Validations

export const insertEventCategorySchema = createInsertSchema(eventCategories, {
  categoryName: (schema) => schema.min(1, 'Category name is required').max(100),
  code: (schema) => schema.min(1, 'Code is required').max(20),
  description: (schema) => schema.max(500).optional().nullable(),
  colorHex: (schema) =>
    schema
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code')
      .optional()
      .nullable(),
})

export const updateEventCategorySchema = insertEventCategorySchema.partial()
export const selectEventCategorySchema = createSelectSchema(eventCategories)

// Role Definition Validations

export const insertRoleDefinitionSchema = createInsertSchema(roleDefinitions, {
  roleName: (schema) =>
    schema
      .min(1, 'Role name is required')
      .max(50)
      .regex(/^[a-z_]+$/, 'Role name must be lowercase with underscores'),
  displayName: (schema) => schema.min(1, 'Display name is required').max(100),
  description: (schema) => schema.max(500).optional().nullable(),
  permissions: () => z.record(z.string(), z.any()).default({}),
  hierarchyLevel: () => z.number().int().min(0).max(100).default(0),
})

export const updateRoleDefinitionSchema = insertRoleDefinitionSchema.partial()
export const selectRoleDefinitionSchema = createSelectSchema(roleDefinitions)

// User Role Validations

export const insertUserRoleSchema = createInsertSchema(userRoles)
export const updateUserRoleSchema = insertUserRoleSchema.partial()
export const selectUserRoleSchema = createSelectSchema(userRoles)

// API Request Validations

export const approveHoursSchema = z.object({
  participationId: z.string().uuid('Invalid participation ID'),
  approvedBy: z.string().uuid('Invalid approver ID'),
  approvedHours: z.number().int().min(0).max(24).optional(),
  notes: z.string().max(500).optional(),
})

export const bulkApproveHoursSchema = z.object({
  participationIds: z.array(z.string().uuid()).min(1, 'At least one participation ID required'),
  approvedBy: z.string().uuid('Invalid approver ID'),
  notes: z.string().max(500).optional(),
})

export const rejectHoursSchema = z.object({
  participationId: z.string().uuid('Invalid participation ID'),
  rejectedBy: z.string().uuid('Invalid rejector ID'),
  notes: z.string().max(500).optional(),
})

export const eventRegistrationSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  volunteerId: z.string().uuid('Invalid volunteer ID'),
})

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const searchSchema = z.object({
  query: z.string().max(200).optional(),
  filters: z.record(z.string(), z.any()).optional(),
})

// Type Exports

export type InsertVolunteer = z.infer<typeof insertVolunteerSchema>
export type UpdateVolunteer = z.infer<typeof updateVolunteerSchema>
export type SelectVolunteer = z.infer<typeof selectVolunteerSchema>

export type InsertEvent = z.infer<typeof insertEventSchema>
export type UpdateEvent = z.infer<typeof updateEventSchema>
export type SelectEvent = z.infer<typeof selectEventSchema>

export type InsertEventParticipation = z.infer<typeof insertEventParticipationSchema>
export type UpdateEventParticipation = z.infer<typeof updateEventParticipationSchema>
export type SelectEventParticipation = z.infer<typeof selectEventParticipationSchema>

export type InsertEventCategory = z.infer<typeof insertEventCategorySchema>
export type UpdateEventCategory = z.infer<typeof updateEventCategorySchema>
export type SelectEventCategory = z.infer<typeof selectEventCategorySchema>

export type InsertRoleDefinition = z.infer<typeof insertRoleDefinitionSchema>
export type UpdateRoleDefinition = z.infer<typeof updateRoleDefinitionSchema>
export type SelectRoleDefinition = z.infer<typeof selectRoleDefinitionSchema>

export type InsertUserRole = z.infer<typeof insertUserRoleSchema>
export type UpdateUserRole = z.infer<typeof updateUserRoleSchema>
export type SelectUserRole = z.infer<typeof selectUserRoleSchema>

export type ApproveHoursInput = z.infer<typeof approveHoursSchema>
export type BulkApproveHoursInput = z.infer<typeof bulkApproveHoursSchema>
export type RejectHoursInput = z.infer<typeof rejectHoursSchema>
export type EventRegistrationInput = z.infer<typeof eventRegistrationSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type SearchInput = z.infer<typeof searchSchema>
