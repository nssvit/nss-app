import { relations } from 'drizzle-orm'
import { eventCategories } from './eventCategories'
import { eventParticipation } from './eventParticipation'
import { events } from './events'
import { roleDefinitions } from './roleDefinitions'
import { userRoles } from './userRoles'
import { volunteers } from './volunteers'

// Volunteer relations
export const volunteersRelations = relations(volunteers, ({ many }) => ({
  // User roles where this volunteer is the subject
  assignedRoles: many(userRoles, { relationName: 'volunteerRoles' }),
  // User roles where this volunteer assigned the role
  rolesAssigned: many(userRoles, { relationName: 'assignedByVolunteer' }),
  // Events created by this volunteer
  createdEvents: many(events, { relationName: 'eventCreator' }),
  // Event participations as participant
  participations: many(eventParticipation, { relationName: 'participant' }),
  // Event participations recorded by this volunteer
  recordedParticipations: many(eventParticipation, { relationName: 'recorder' }),
  // Event participations approved by this volunteer
  approvedParticipations: many(eventParticipation, { relationName: 'approver' }),
}))

// Event relations
export const eventsRelations = relations(events, ({ one, many }) => ({
  category: one(eventCategories, {
    fields: [events.categoryId],
    references: [eventCategories.id],
  }),
  createdBy: one(volunteers, {
    fields: [events.createdByVolunteerId],
    references: [volunteers.id],
    relationName: 'eventCreator',
  }),
  participations: many(eventParticipation),
}))

// Event Category relations
export const eventCategoriesRelations = relations(eventCategories, ({ many }) => ({
  events: many(events),
}))

// Role Definition relations
export const roleDefinitionsRelations = relations(roleDefinitions, ({ many }) => ({
  userRoles: many(userRoles),
}))

// User Role relations
export const userRolesRelations = relations(userRoles, ({ one }) => ({
  volunteer: one(volunteers, {
    fields: [userRoles.volunteerId],
    references: [volunteers.id],
    relationName: 'volunteerRoles',
  }),
  roleDefinition: one(roleDefinitions, {
    fields: [userRoles.roleDefinitionId],
    references: [roleDefinitions.id],
  }),
  assignedByVolunteer: one(volunteers, {
    fields: [userRoles.assignedBy],
    references: [volunteers.id],
    relationName: 'assignedByVolunteer',
  }),
}))

// Event Participation relations
export const eventParticipationRelations = relations(eventParticipation, ({ one }) => ({
  event: one(events, {
    fields: [eventParticipation.eventId],
    references: [events.id],
  }),
  volunteer: one(volunteers, {
    fields: [eventParticipation.volunteerId],
    references: [volunteers.id],
    relationName: 'participant',
  }),
  recordedBy: one(volunteers, {
    fields: [eventParticipation.recordedByVolunteerId],
    references: [volunteers.id],
    relationName: 'recorder',
  }),
  approvedByVolunteer: one(volunteers, {
    fields: [eventParticipation.approvedBy],
    references: [volunteers.id],
    relationName: 'approver',
  }),
}))
