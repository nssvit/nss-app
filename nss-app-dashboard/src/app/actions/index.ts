/**
 * Server Actions Index
 *
 * Re-exports all server actions for convenient imports.
 * Usage: import { getVolunteers, createEvent } from '@/app/actions'
 */

// Dashboard actions
export {
  getDashboardStats,
  getMonthlyTrends,
  getPendingApprovalsCount,
  getUserStats,
} from './dashboard'

// Volunteer actions
export {
  getVolunteers,
  getVolunteerById,
  getVolunteerByAuthId,
  getCurrentVolunteer,
  updateVolunteer,
  getVolunteerParticipationHistory,
  getVolunteerHoursSummary,
} from './volunteers'

// Event actions
export {
  getEvents,
  getEventById,
  getUpcomingEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventParticipants,
  registerForEvent,
  canRegisterForEvent,
} from './events'
export type { CreateEventInput, UpdateEventInput } from './events'

// Attendance actions
export {
  markAttendance,
  updateAttendance,
  syncAttendance,
  getEventParticipants as getAttendanceParticipants,
  getAttendanceSummary,
} from './attendance'

// Hours approval actions
export {
  getPendingApprovals,
  approveHours,
  rejectHours,
  bulkApproveHours,
  resetApproval,
  getPendingCount,
} from './hours'

// Role actions
export {
  getRoles,
  getVolunteerRoles,
  getCurrentUserRoles,
  hasRole,
  hasAnyRole,
  isAdmin,
  isCurrentUserAdmin,
  assignRole,
  revokeRole,
} from './roles'

// Report actions
export {
  getCategoryDistribution,
  getTopEventsByImpact,
  getAttendanceSummary as getReportAttendanceSummary,
  getVolunteerHoursSummary as getReportVolunteerHours,
  getMonthlyTrends as getReportMonthlyTrends,
  getUserStats as getReportUserStats,
  getDashboardStats as getReportDashboardStats,
} from './reports'

// Category actions
export { getCategories, getCategoryById, getCategoryByCode } from './categories'
