'use client'

/**
 * ProfilePage Component
 * Uses Server Actions via useProfile hook (full Drizzle consistency)
 * Note: Avatar upload still uses Supabase Storage (acceptable for file storage)
 */

import { useState, useEffect, useCallback } from 'react'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/hooks/useProfile'
import { updateProfilePicture } from '@/app/actions/volunteers'
import { supabase } from '@/lib/supabase' // Only for storage uploads
import { ToastContainer } from '@/components/Toast'
import { validateEmail, validatePhone, validateRequired } from '@/utils/validation'
import { Skeleton } from '../Skeleton'
import { ProfileHeader } from './ProfileHeader'
import { ProfileStats } from './ProfileStats'
import { ProfileForm } from './ProfileForm'
import { ProfileActivity } from './ProfileActivity'
import { ProfileHistory } from './ProfileHistory'
import { ProfilePreferences } from './ProfilePreferences'
import type {
  ProfileData,
  ProfileStats as Stats,
  ParticipationHistory,
  MonthlyActivity,
  ProfilePreferences as Preferences,
  ProfileTab,
} from './types'

const TABS = [
  { id: 'profile' as const, name: 'Profile', icon: 'fas fa-user' },
  { id: 'activity' as const, name: 'Activity', icon: 'fas fa-chart-line' },
  { id: 'history' as const, name: 'History', icon: 'fas fa-history' },
  { id: 'preferences' as const, name: 'Preferences', icon: 'fas fa-sliders-h' },
]

export function ProfilePage() {
  const layout = useResponsiveLayout()
  const { currentUser } = useAuth()
  const { toasts, removeToast, success, error } = useToast()
  const { profileData: hookProfileData, stats: hookStats, participationHistory: hookHistory, loading: hookLoading, updateProfile, refetch } = useProfile()

  const [activeTab, setActiveTab] = useState<ProfileTab>('profile')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Use hook data or fall back to currentUser
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '', lastName: '', email: '', phoneNo: '', branch: '',
    year: 0, rollNumber: '', address: '', birthDate: '', gender: '',
    nssJoinYear: 0, profilePic: null,
  })

  const [stats, setStats] = useState<Stats>({ totalHours: 0, approvedHours: 0, eventsParticipated: 0, pendingReviews: 0 })
  const [participationHistory, setParticipationHistory] = useState<ParticipationHistory[]>([])
  const [monthlyActivity, setMonthlyActivity] = useState<MonthlyActivity[]>([])
  const [preferences, setPreferences] = useState<Preferences>({
    emailNotifications: true, smsNotifications: false, eventReminders: true, newsletter: true,
  })

  // Sync hook data to local state
  useEffect(() => {
    if (hookProfileData) {
      setProfileData(hookProfileData)
    } else if (currentUser) {
      // Fall back to currentUser if hook data not available
      setProfileData({
        firstName: currentUser.first_name || '',
        lastName: currentUser.last_name || '',
        email: currentUser.email || '',
        phoneNo: currentUser.phone_no || '',
        branch: currentUser.branch || '',
        year: currentUser.year || 0,
        rollNumber: currentUser.roll_number || '',
        address: currentUser.address || '',
        birthDate: currentUser.birth_date || '',
        gender: currentUser.gender || '',
        nssJoinYear: currentUser.nss_join_year || 0,
        profilePic: currentUser.profile_pic,
      })
    }
  }, [hookProfileData, currentUser])

  useEffect(() => {
    if (hookStats) {
      setStats(hookStats)
    }
  }, [hookStats])

  useEffect(() => {
    if (hookHistory) {
      setParticipationHistory(hookHistory)

      // Calculate monthly activity from history
      const monthlyData: Record<string, { events: number; hours: number }> = {}
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        monthlyData[date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })] = { events: 0, hours: 0 }
      }
      hookHistory.forEach((p) => {
        if (p.eventDate) {
          const key = new Date(p.eventDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
          if (monthlyData[key]) {
            monthlyData[key].events += 1
            monthlyData[key].hours += p.hoursAttended
          }
        }
      })
      setMonthlyActivity(Object.entries(monthlyData).map(([month, data]) => ({ month, ...data })))
    }
  }, [hookHistory])

  const handleAvatarChange = async (file: File) => {
    if (!currentUser?.volunteer_id || file.size > 5 * 1024 * 1024 || !file.type.startsWith('image/')) {
      error(file.size > 5 * 1024 * 1024 ? 'File size must be less than 5MB' : 'Please select an image file')
      return
    }
    try {
      setUploading(true)
      const fileName = `profile-pics/${currentUser.volunteer_id}-${Date.now()}.${file.name.split('.').pop()}`

      // Use Supabase Storage for file upload (acceptable - this is file storage, not data)
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)

      // Update profile pic URL via Server Action (Drizzle)
      await updateProfilePicture(publicUrl)

      setProfileData((prev) => ({ ...prev, profilePic: publicUrl }))
      success('Profile picture updated!')
    } catch (err: any) {
      error(err.message || 'Failed to upload')
    } finally {
      setUploading(false)
    }
  }

  const handleFieldChange = (field: keyof ProfileData, value: string | number) => {
    setProfileData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleSave = async () => {
    const newErrors: Record<string, string> = {}
    if (!validateRequired(profileData.firstName)) newErrors.firstName = 'First name is required'
    if (!validateRequired(profileData.lastName)) newErrors.lastName = 'Last name is required'
    if (!validateEmail(profileData.email)) newErrors.email = 'Please enter a valid email address'
    if (profileData.phoneNo && !validatePhone(profileData.phoneNo)) newErrors.phoneNo = 'Please enter a valid phone number'
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      error('Please fix the errors')
      return
    }

    try {
      setSaving(true)
      const result = await updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phoneNo: profileData.phoneNo,
        address: profileData.address,
        gender: profileData.gender,
      })

      if (result.error) {
        error(result.error)
      } else {
        success('Profile saved successfully!')
      }
    } catch (err: any) {
      error(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const loading = hookLoading

  if (loading) {
    return (
      <div className={`flex-1 overflow-x-hidden overflow-y-auto main-content-bg ${layout.getContentPadding()}`}>
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-48 rounded-xl mb-6" />
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className={`flex-1 overflow-x-hidden overflow-y-auto main-content-bg mobile-scroll safe-area-bottom ${layout.getContentPadding()}`}>
      <div className="max-w-6xl mx-auto">
        <ProfileHeader profileData={profileData} roles={currentUser?.roles || []} isMobile={layout.isMobile} uploading={uploading} onAvatarChange={handleAvatarChange} />
        <ProfileStats stats={stats} isMobile={layout.isMobile} />

        <div className="card-glass rounded-xl overflow-hidden">
          <div className="flex border-b border-gray-700/30 overflow-x-auto">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-all focus-visible whitespace-nowrap min-w-[100px] ${
                  activeTab === tab.id ? 'bg-indigo-600/20 text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
                }`}>
                <i className={`${tab.icon} fa-sm`}></i><span>{tab.name}</span>
              </button>
            ))}
          </div>
          <div className="p-6">
            {activeTab === 'profile' && <ProfileForm profileData={profileData} errors={errors} saving={saving} onFieldChange={handleFieldChange} onSave={handleSave} />}
            {activeTab === 'activity' && <ProfileActivity monthlyActivity={monthlyActivity} stats={stats} />}
            {activeTab === 'history' && <ProfileHistory history={participationHistory} />}
            {activeTab === 'preferences' && <ProfilePreferences preferences={preferences} onPreferenceChange={(k, v) => setPreferences((p) => ({ ...p, [k]: v }))} />}
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
