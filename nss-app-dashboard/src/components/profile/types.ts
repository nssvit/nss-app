/**
 * Profile Component Types
 */

export interface ProfileStats {
  totalHours: number
  approvedHours: number
  eventsParticipated: number
  pendingReviews: number
}

export interface ParticipationHistory {
  eventId: string
  eventName: string
  eventDate: string | null
  categoryName: string | null
  hoursAttended: number
  approvedHours: number | null
  approvalStatus: string
  participationStatus: string
}

export interface MonthlyActivity {
  month: string
  events: number
  hours: number
}

export interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phoneNo: string
  branch: string
  year: string | number
  rollNumber: string
  address: string
  birthDate: string
  gender: string
  nssJoinYear: string | number | null
  profilePic: string | null
}

export interface ProfilePreferences {
  emailNotifications: boolean
  smsNotifications: boolean
  eventReminders: boolean
  newsletter: boolean
}

export type ProfileTab = 'profile' | 'activity' | 'history' | 'preferences'
