import type {
  DashboardStats,
  ActivityTrend,
  EventWithStats,
  VolunteerWithStats,
  EventParticipationWithVolunteer,
  EventParticipationWithEvent,
  EventCategory,
  RoleDefinition,
  UserRoleWithDefinition,
  CurrentUser,
} from '@/types'
import {
  mockDashboardStats,
  mockActivityTrends,
  mockEventsWithStats,
  mockVolunteersWithStats,
  mockParticipationsWithVolunteer,
  mockParticipationsWithEvent,
  mockCategories,
  mockRoleDefinitions,
  mockUserRolesWithDefinition,
} from './mock-data'

// simulate network delay
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

export async function getDashboardStats(): Promise<DashboardStats> {
  await delay()
  return mockDashboardStats
}

export async function getActivityTrends(): Promise<ActivityTrend[]> {
  await delay()
  return mockActivityTrends
}

export async function getEvents(): Promise<EventWithStats[]> {
  await delay()
  return mockEventsWithStats
}

export async function getEventById(id: string): Promise<EventWithStats | null> {
  await delay()
  return mockEventsWithStats.find((e) => e.id === id) ?? null
}

export async function getVolunteers(): Promise<VolunteerWithStats[]> {
  await delay()
  return mockVolunteersWithStats
}

export async function getEventParticipants(
  eventId: string
): Promise<EventParticipationWithVolunteer[]> {
  await delay()
  return mockParticipationsWithVolunteer.filter((p) => p.eventId === eventId)
}

export async function getVolunteerParticipations(
  volunteerId: string
): Promise<EventParticipationWithEvent[]> {
  await delay()
  return mockParticipationsWithEvent.filter((p) => p.volunteerId === volunteerId)
}

export async function getCategories(): Promise<EventCategory[]> {
  await delay()
  return mockCategories
}

export async function getRoleDefinitions(): Promise<RoleDefinition[]> {
  await delay()
  return mockRoleDefinitions
}

export async function getUserRoles(): Promise<UserRoleWithDefinition[]> {
  await delay()
  return mockUserRolesWithDefinition
}

export async function getPendingApprovals(): Promise<EventParticipationWithVolunteer[]> {
  await delay()
  return mockParticipationsWithVolunteer.filter((p) => p.approvalStatus === 'pending')
}

export async function getCurrentUser(): Promise<CurrentUser> {
  await delay()
  return {
    volunteerId: 'v1',
    firstName: 'Aarav',
    lastName: 'Sharma',
    email: 'aarav@college.edu',
    rollNumber: 'CS2101',
    branch: 'Computer Science',
    year: 3,
    phoneNo: '9876543210',
    birthDate: '2003-05-15',
    gender: 'male',
    nssJoinYear: 2023,
    address: 'Mumbai',
    profilePic: null,
    isActive: true,
    roles: ['admin'],
  }
}
