export const ROLES = {
  ADMIN: 'admin',
  PROGRAM_OFFICER: 'program_officer',
  EVENT_LEAD: 'event_lead',
  DOCUMENTATION_LEAD: 'documentation_lead',
  VOLUNTEER: 'volunteer',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.ADMIN]: 0,
  [ROLES.PROGRAM_OFFICER]: 1,
  [ROLES.EVENT_LEAD]: 2,
  [ROLES.DOCUMENTATION_LEAD]: 3,
  [ROLES.VOLUNTEER]: 4,
}

export const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.PROGRAM_OFFICER]: 'Program Officer',
  [ROLES.EVENT_LEAD]: 'Event Lead',
  [ROLES.DOCUMENTATION_LEAD]: 'Documentation Lead',
  [ROLES.VOLUNTEER]: 'Volunteer',
}

export const ROLE_COLORS: Record<Role, string> = {
  [ROLES.ADMIN]: 'bg-red-500/20 text-red-400',
  [ROLES.PROGRAM_OFFICER]: 'bg-purple-500/20 text-purple-400',
  [ROLES.EVENT_LEAD]: 'bg-blue-500/20 text-blue-400',
  [ROLES.DOCUMENTATION_LEAD]: 'bg-cyan-500/20 text-cyan-400',
  [ROLES.VOLUNTEER]: 'bg-green-500/20 text-green-400',
}

export const EVENT_STATUS = {
  PLANNED: 'planned',
  REGISTRATION_OPEN: 'registration_open',
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS]

export const EVENT_STATUS_DISPLAY: Record<EventStatus, string> = {
  [EVENT_STATUS.PLANNED]: 'Planned',
  [EVENT_STATUS.REGISTRATION_OPEN]: 'Registration Open',
  [EVENT_STATUS.UPCOMING]: 'Upcoming',
  [EVENT_STATUS.ONGOING]: 'Ongoing',
  [EVENT_STATUS.COMPLETED]: 'Completed',
  [EVENT_STATUS.CANCELLED]: 'Cancelled',
}

export const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  [EVENT_STATUS.PLANNED]: 'bg-gray-500/20 text-gray-400',
  [EVENT_STATUS.REGISTRATION_OPEN]: 'bg-blue-500/20 text-blue-400',
  [EVENT_STATUS.UPCOMING]: 'bg-yellow-500/20 text-yellow-400',
  [EVENT_STATUS.ONGOING]: 'bg-green-500/20 text-green-400',
  [EVENT_STATUS.COMPLETED]: 'bg-purple-500/20 text-purple-400',
  [EVENT_STATUS.CANCELLED]: 'bg-red-500/20 text-red-400',
}

export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const

export type ApprovalStatus = (typeof APPROVAL_STATUS)[keyof typeof APPROVAL_STATUS]

export const APPROVAL_STATUS_DISPLAY: Record<ApprovalStatus, string> = {
  [APPROVAL_STATUS.PENDING]: 'Pending',
  [APPROVAL_STATUS.APPROVED]: 'Approved',
  [APPROVAL_STATUS.REJECTED]: 'Rejected',
}

export const APPROVAL_STATUS_COLORS: Record<ApprovalStatus, string> = {
  [APPROVAL_STATUS.PENDING]: 'bg-yellow-500/20 text-yellow-400',
  [APPROVAL_STATUS.APPROVED]: 'bg-green-500/20 text-green-400',
  [APPROVAL_STATUS.REJECTED]: 'bg-red-500/20 text-red-400',
}

export const PARTICIPATION_STATUS = {
  REGISTERED: 'registered',
  PRESENT: 'present',
  PARTIALLY_PRESENT: 'partially_present',
  ABSENT: 'absent',
} as const

export type ParticipationStatus = (typeof PARTICIPATION_STATUS)[keyof typeof PARTICIPATION_STATUS]

export const PARTICIPATION_STATUS_DISPLAY: Record<ParticipationStatus, string> = {
  [PARTICIPATION_STATUS.REGISTERED]: 'Registered',
  [PARTICIPATION_STATUS.PRESENT]: 'Present',
  [PARTICIPATION_STATUS.PARTIALLY_PRESENT]: 'Partially Present',
  [PARTICIPATION_STATUS.ABSENT]: 'Absent',
}

export const PARTICIPATION_STATUS_COLORS: Record<ParticipationStatus, string> = {
  [PARTICIPATION_STATUS.REGISTERED]: 'bg-blue-500/20 text-blue-400',
  [PARTICIPATION_STATUS.PRESENT]: 'bg-green-500/20 text-green-400',
  [PARTICIPATION_STATUS.PARTIALLY_PRESENT]: 'bg-yellow-500/20 text-yellow-400',
  [PARTICIPATION_STATUS.ABSENT]: 'bg-red-500/20 text-red-400',
}

export const BRANCHES = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Mechanical',
  'Civil',
  'Electrical',
  'Chemical',
] as const

export const YEARS = [1, 2, 3, 4] as const

export function hasHigherOrEqualPrivilege(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] <= ROLE_HIERARCHY[requiredRole]
}

export function getHighestRole(roles: Role[]): Role | null {
  if (roles.length === 0) return null
  return roles.reduce((highest, current) =>
    ROLE_HIERARCHY[current] < ROLE_HIERARCHY[highest] ? current : highest
  )
}

export function hasAnyRole(userRoles: Role[], requiredRoles: Role[]): boolean {
  return userRoles.some((role) => requiredRoles.includes(role))
}
