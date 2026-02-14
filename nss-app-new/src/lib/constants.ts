export const ROLES = {
  ADMIN: 'admin',
  HEAD: 'head',
  VOLUNTEER: 'volunteer',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.ADMIN]: 100,
  [ROLES.HEAD]: 50,
  [ROLES.VOLUNTEER]: 10,
}

export const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.HEAD]: 'NSS Head',
  [ROLES.VOLUNTEER]: 'Volunteer',
}

export const ROLE_COLORS: Record<Role, string> = {
  [ROLES.ADMIN]: 'bg-red-500/20 text-red-400',
  [ROLES.HEAD]: 'bg-purple-500/20 text-purple-400',
  [ROLES.VOLUNTEER]: 'bg-green-500/20 text-green-400',
}

export const EVENT_STATUS = {
  PLANNED: 'planned',
  REGISTRATION_OPEN: 'registration_open',
  REGISTRATION_CLOSED: 'registration_closed',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS]

export const EVENT_STATUS_DISPLAY: Record<EventStatus, string> = {
  [EVENT_STATUS.PLANNED]: 'Planned',
  [EVENT_STATUS.REGISTRATION_OPEN]: 'Registration Open',
  [EVENT_STATUS.REGISTRATION_CLOSED]: 'Registration Closed',
  [EVENT_STATUS.ONGOING]: 'Ongoing',
  [EVENT_STATUS.COMPLETED]: 'Completed',
  [EVENT_STATUS.CANCELLED]: 'Cancelled',
}

export const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  [EVENT_STATUS.PLANNED]: 'bg-gray-500/20 text-gray-400',
  [EVENT_STATUS.REGISTRATION_OPEN]: 'bg-blue-500/20 text-blue-400',
  [EVENT_STATUS.REGISTRATION_CLOSED]: 'bg-yellow-500/20 text-yellow-400',
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
  EXCUSED: 'excused',
} as const

export type ParticipationStatus = (typeof PARTICIPATION_STATUS)[keyof typeof PARTICIPATION_STATUS]

export const PARTICIPATION_STATUS_DISPLAY: Record<ParticipationStatus, string> = {
  [PARTICIPATION_STATUS.REGISTERED]: 'Registered',
  [PARTICIPATION_STATUS.PRESENT]: 'Present',
  [PARTICIPATION_STATUS.PARTIALLY_PRESENT]: 'Partially Present',
  [PARTICIPATION_STATUS.ABSENT]: 'Absent',
  [PARTICIPATION_STATUS.EXCUSED]: 'Excused',
}

export const PARTICIPATION_STATUS_COLORS: Record<ParticipationStatus, string> = {
  [PARTICIPATION_STATUS.REGISTERED]: 'bg-blue-500/20 text-blue-400',
  [PARTICIPATION_STATUS.PRESENT]: 'bg-green-500/20 text-green-400',
  [PARTICIPATION_STATUS.PARTIALLY_PRESENT]: 'bg-yellow-500/20 text-yellow-400',
  [PARTICIPATION_STATUS.ABSENT]: 'bg-red-500/20 text-red-400',
  [PARTICIPATION_STATUS.EXCUSED]: 'bg-gray-500/20 text-gray-400',
}

export const BRANCHES = ['EXCS', 'CMPN', 'IT', 'BIO-MED', 'EXTC'] as const

export const BRANCH_DISPLAY_NAMES: Record<string, string> = {
  EXCS: 'Electronics & Computer Science',
  CMPN: 'Computer Engineering',
  IT: 'Information Technology',
  'BIO-MED': 'Biomedical Engineering',
  EXTC: 'Electronics & Telecommunication',
}

export const YEARS = ['FE', 'SE', 'TE'] as const

export const YEAR_DISPLAY_NAMES: Record<string, string> = {
  FE: 'First Year (FE)',
  SE: 'Second Year (SE)',
  TE: 'Third Year (TE)',
}
