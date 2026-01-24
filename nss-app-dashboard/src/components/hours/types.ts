/**
 * Hours Approval Types
 */

export interface Participation {
  id: string
  hoursAttended: number
  approvedHours: number | null
  approvalStatus: string
  volunteer?: {
    firstName: string
    lastName: string
    rollNumber: string
    email: string
    profilePic?: string | null
  }
  event?: {
    eventName: string
    startDate: string
  }
}

export type ApprovalFilter = 'pending' | 'approved' | 'rejected' | 'all'

export interface ApprovalStats {
  pending: number
  approved: number
  rejected: number
  total: number
  totalHoursPending: number
  totalHoursApproved: number
}
