/**
 * Drizzle ORM Type-Safe Queries
 *
 * This module provides type-safe database queries using Drizzle ORM.
 * These queries are for SERVER-SIDE USE ONLY (API routes, server actions).
 *
 * IMPORTANT:
 * - These bypass RLS, so authorization must be checked in application code
 * - For admin operations that need SECURITY DEFINER, keep using RPC functions
 * - For client-side queries that rely on RLS, use Supabase client
 *
 * Usage:
 * ```typescript
 * // In an API route or server action
 * import { queries } from '@/db/queries'
 *
 * export async function GET() {
 *   const stats = await queries.getDashboardStats()
 *   return Response.json(stats)
 * }
 * ```
 */

// Dashboard queries
export { getDashboardStats, getMonthlyActivityTrends } from './dashboard'

// Volunteer queries
export {
  getVolunteersWithStats,
  getVolunteerById,
  getVolunteerByAuthId,
  adminGetAllVolunteers,
  adminUpdateVolunteer,
} from './volunteers'

// Event queries
export {
  getEventsWithStats,
  getEventById,
  getUpcomingEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  canRegisterForEvent,
  resetEventAttendance,
} from './events'

// Attendance queries
export {
  getEventParticipants,
  markEventAttendance,
  updateEventAttendance,
  syncEventAttendance,
  registerForEvent,
  updateParticipationStatus,
  bulkMarkAttendance,
  getEventsForAttendance,
} from './attendance'

// Hours approval queries
export {
  getPendingApprovalsCount,
  getPendingParticipations,
  approveHoursTransaction,
  rejectHoursTransaction,
  bulkApproveHoursTransaction,
  resetApprovalTransaction,
} from './hours'

// Role queries
export {
  getVolunteerRoles,
  volunteerHasRole,
  volunteerHasAnyRole,
  isVolunteerAdmin,
  getAllRoles,
  createRoleDefinition,
  updateRoleDefinition,
  getAllUserRolesWithNames,
  adminAssignRole,
  adminRevokeRole,
} from './roles'

// Report queries
export {
  getCategoryDistribution,
  getTopEventsByImpact,
  getAttendanceSummary,
  getVolunteerHoursSummary,
  getVolunteerParticipationHistory,
  getUserStats,
} from './reports'

// Import all for namespace export
import * as attendance from './attendance'
import * as dashboard from './dashboard'
import * as events from './events'
import * as hours from './hours'
import * as reports from './reports'
import * as roles from './roles'
import * as volunteers from './volunteers'

/**
 * Backward-compatible queries namespace
 * Maintains the same API as the original queries.ts
 */
export const queries = {
  // Dashboard
  getDashboardStats: dashboard.getDashboardStats,
  getMonthlyActivityTrends: dashboard.getMonthlyActivityTrends,

  // Volunteers
  getVolunteersWithStats: volunteers.getVolunteersWithStats,
  getVolunteerById: volunteers.getVolunteerById,
  getVolunteerByAuthId: volunteers.getVolunteerByAuthId,

  // Events
  getEventsWithStats: events.getEventsWithStats,
  getEventById: events.getEventById,
  getUpcomingEvents: events.getUpcomingEvents,
  getEventParticipants: attendance.getEventParticipants,
  createEvent: events.createEvent,
  updateEvent: events.updateEvent,
  deleteEvent: events.deleteEvent,
  canRegisterForEvent: events.canRegisterForEvent,
  resetEventAttendance: events.resetEventAttendance,
  registerForEvent: attendance.registerForEvent,

  // Reports
  getCategoryDistribution: reports.getCategoryDistribution,
  getTopEventsByImpact: reports.getTopEventsByImpact,
  getPendingApprovalsCount: hours.getPendingApprovalsCount,
  getAttendanceSummary: reports.getAttendanceSummary,
  getVolunteerHoursSummary: reports.getVolunteerHoursSummary,
  getVolunteerParticipationHistory: reports.getVolunteerParticipationHistory,
  getUserStats: reports.getUserStats,

  // Hours Approval
  getPendingParticipations: hours.getPendingParticipations,
  approveHoursTransaction: hours.approveHoursTransaction,
  rejectHoursTransaction: hours.rejectHoursTransaction,
  bulkApproveHoursTransaction: hours.bulkApproveHoursTransaction,
  resetApprovalTransaction: hours.resetApprovalTransaction,

  // Attendance
  markEventAttendance: attendance.markEventAttendance,
  updateEventAttendance: attendance.updateEventAttendance,
  syncEventAttendance: attendance.syncEventAttendance,
  updateParticipationStatus: attendance.updateParticipationStatus,
  bulkMarkAttendance: attendance.bulkMarkAttendance,
  getEventsForAttendance: attendance.getEventsForAttendance,

  // Roles
  getVolunteerRoles: roles.getVolunteerRoles,
  volunteerHasRole: roles.volunteerHasRole,
  volunteerHasAnyRole: roles.volunteerHasAnyRole,
  isVolunteerAdmin: roles.isVolunteerAdmin,
  getAllRoles: roles.getAllRoles,
  createRoleDefinition: roles.createRoleDefinition,
  updateRoleDefinition: roles.updateRoleDefinition,

  // Admin
  adminGetAllVolunteers: volunteers.adminGetAllVolunteers,
  adminUpdateVolunteer: volunteers.adminUpdateVolunteer,
  getAllUserRolesWithNames: roles.getAllUserRolesWithNames,
  adminAssignRole: roles.adminAssignRole,
  adminRevokeRole: roles.adminRevokeRole,
}

export default queries
