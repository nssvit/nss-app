// Volunteer base type (matches Drizzle schema)
export interface Volunteer {
  id: string
  firstName: string
  lastName: string
  email: string
  rollNumber: string
  branch: string
  year: string
  phoneNo: string | null
  birthDate: string | null
  gender: string | null
  nssJoinYear: number | null
  address: string | null
  profilePic: string | null
  isActive: boolean
  authUserId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface VolunteerWithStats extends Volunteer {
  eventsParticipated?: number
  totalHours?: number
  approvedHours?: number
  joinDate?: string
}

// Event types
export interface EventCategory {
  id: number
  categoryName: string
  code: string
  description: string | null
  colorHex: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Event {
  id: string
  eventName: string
  description: string | null
  startDate: Date | string
  endDate: Date | string
  location: string | null
  minParticipants: number | null
  maxParticipants: number | null
  eventStatus: string
  declaredHours: number
  categoryId: number
  registrationDeadline: Date | string | null
  isActive: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface EventWithStats extends Event {
  category?: EventCategory | null
  categoryName?: string | null
  categoryColor?: string | null
  participantCount?: number
  totalHours?: number
}

export interface EventWithDetails extends Event {
  category: EventCategory | null
  createdByVolunteer: Volunteer | null
  participants: EventParticipationWithVolunteer[]
}

// Event participation
export interface EventParticipation {
  id: string
  eventId: string
  volunteerId: string
  participationStatus: string
  hoursAttended: number
  approvalStatus: string
  approvedBy: string | null
  approvedAt: Date | null
  approvalNotes?: string | null
  feedback: string | null
  createdAt?: Date
  registeredAt: Date
  updatedAt: Date
}

export interface EventParticipationWithVolunteer extends EventParticipation {
  volunteer?: Volunteer
  volunteerName?: string
}

export interface EventParticipationWithEvent extends EventParticipation {
  event?: Event
  eventName?: string
  startDate?: Date | string | null
  categoryName?: string
  approvedHours?: number | null
}

// Roles
export interface RoleDefinition {
  id: string
  roleName: string
  displayName: string
  description: string | null
  hierarchyLevel: number
  permissions: Record<string, string[]>
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserRole {
  id: string
  volunteerId: string
  roleDefinitionId: string
  assignedBy: string | null
  assignedAt: Date
  expiresAt: Date | null
  isActive: boolean | null
  createdAt: Date
  updatedAt: Date
}

export interface UserRoleWithDefinition extends UserRole {
  roleDefinition: RoleDefinition
}

// Current user
export interface CurrentUser {
  volunteerId: string
  firstName: string
  lastName: string
  email: string
  rollNumber: string
  branch: string
  year: string
  phoneNo: string | null
  birthDate: string | null
  gender: string | null
  nssJoinYear: number | null
  address: string | null
  profilePic: string | null
  isActive: boolean
  roles: string[]
  permissions?: Record<string, string[]>
}

// Dashboard
export interface DashboardStats {
  totalEvents: number
  activeVolunteers: number
  totalHours: number
  ongoingProjects: number
}

export interface ActivityTrend {
  month: string
  monthNumber: number
  yearNumber: number
  eventsCount: number
  volunteersCount: number
  hoursSum: number
}

// Reports
export interface CategoryDistribution {
  categoryId: number
  categoryName: string
  eventCount: number
  colorHex: string
  participantCount: number
  totalHours: number
}

export interface TopEvent {
  eventId: string
  eventName: string
  startDate: string | null
  categoryName: string
  participantCount: number
  totalHours: number
  impactScore: string
}

export interface VolunteerHoursSummary {
  volunteerId: string
  volunteerName: string
  totalHours: number
  approvedHours: number
  eventsCount: number
  lastActivity: Date | null
}

export interface AttendanceSummary {
  eventId: string
  eventName: string
  startDate: Date | null
  categoryName: string | null
  totalRegistered: number
  totalPresent: number
  totalAbsent: number
  attendanceRate: number
  totalHours: number
}

export interface UserStats {
  totalUsers: number
  activeUsers: number
  pendingUsers: number
  adminCount: number
}
