'use client'

import { useState, useRef, useEffect } from 'react'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { ToastContainer } from '@/components/Toast'
import { validateEmail, validatePhone, validateRequired } from '@/utils/validation'
import { Skeleton } from './Skeleton'
import Image from 'next/image'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ProfileStats {
  totalHours: number
  approvedHours: number
  eventsParticipated: number
  pendingReviews: number
}

interface ParticipationHistory {
  event_id: string
  event_name: string
  event_date: string
  category_name: string
  hours_attended: number
  approved_hours: number | null
  approval_status: string
  participation_status: string
}

interface MonthlyActivity {
  month: string
  events: number
  hours: number
}

export function ProfilePage() {
  const layout = useResponsiveLayout()
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toasts, removeToast, success, error } = useToast()
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Profile data from database
  const [profileData, setProfileData] = useState<{
    first_name: string
    last_name: string
    email: string
    phone_no: string
    branch: string
    year: string | number
    roll_number: string
    address: string
    birth_date: string
    gender: string
    nss_join_year: string | number
    profile_pic: string | null
  }>({
    first_name: '',
    last_name: '',
    email: '',
    phone_no: '',
    branch: '',
    year: '',
    roll_number: '',
    address: '',
    birth_date: '',
    gender: '',
    nss_join_year: 0,
    profile_pic: null as string | null,
  })

  // Stats from database
  const [stats, setStats] = useState<ProfileStats>({
    totalHours: 0,
    approvedHours: 0,
    eventsParticipated: 0,
    pendingReviews: 0,
  })

  // Participation history
  const [participationHistory, setParticipationHistory] = useState<ParticipationHistory[]>([])

  // Monthly activity data
  const [monthlyActivity, setMonthlyActivity] = useState<MonthlyActivity[]>([])

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    eventReminders: true,
    newsletter: true,
  })

  useEffect(() => {
    if (currentUser) {
      loadProfileData()
    }
  }, [currentUser])

  const loadProfileData = async () => {
    if (!currentUser?.volunteer_id) return

    try {
      setLoading(true)

      // Load profile data, participation history, and stats in parallel
      const [participationResult] = await Promise.all([
        supabase
          .from('event_participation')
          .select(
            `
            id,
            event_id,
            hours_attended,
            approved_hours,
            approval_status,
            participation_status,
            created_at,
            events (
              event_name,
              event_date,
              event_categories (category_name)
            )
          `
          )
          .eq('volunteer_id', currentUser.volunteer_id)
          .order('created_at', { ascending: false }),
      ])

      // Set profile data from currentUser
      setProfileData({
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
        email: currentUser.email || '',
        phone_no: currentUser.phone_no || '',
        branch: currentUser.branch || '',
        year: currentUser.year || 0,
        roll_number: currentUser.roll_number || '',
        address: currentUser.address || '',
        birth_date: currentUser.birth_date || '',
        gender: currentUser.gender || '',
        nss_join_year: currentUser.nss_join_year || 0,
        profile_pic: currentUser.profile_pic,
      })

      // Process participation data
      const participations = participationResult.data || []

      const history: ParticipationHistory[] = participations.map((p: any) => ({
        event_id: p.event_id,
        event_name: p.events?.event_name || 'Unknown Event',
        event_date: p.events?.event_date || '',
        category_name: p.events?.event_categories?.category_name || 'General',
        hours_attended: p.hours_attended || 0,
        approved_hours: p.approved_hours,
        approval_status: p.approval_status || 'pending',
        participation_status: p.participation_status || 'registered',
      }))

      setParticipationHistory(history)

      // Calculate stats
      const totalHours = history.reduce((sum, p) => sum + p.hours_attended, 0)
      const approvedHours = history.reduce((sum, p) => sum + (p.approved_hours || 0), 0)
      const pendingReviews = history.filter(
        (p) => p.approval_status === 'pending' && p.hours_attended > 0
      ).length

      setStats({
        totalHours,
        approvedHours,
        eventsParticipated: history.length,
        pendingReviews,
      })

      // Calculate monthly activity for last 6 months
      const monthlyData: Record<string, { events: number; hours: number }> = {}
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        monthlyData[monthKey] = { events: 0, hours: 0 }
      }

      history.forEach((p) => {
        const eventDate = new Date(p.event_date)
        const monthKey = eventDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].events += 1
          monthlyData[monthKey].hours += p.hours_attended
        }
      })

      setMonthlyActivity(
        Object.entries(monthlyData).map(([month, data]) => ({
          month,
          events: data.events,
          hours: data.hours,
        }))
      )
    } catch (err) {
      console.error('Error loading profile data:', err)
      error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser?.volunteer_id) return

    if (file.size > 5 * 1024 * 1024) {
      error('File size must be less than 5MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      error('Please select an image file')
      return
    }

    try {
      setUploading(true)

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentUser.volunteer_id}-${Date.now()}.${fileExt}`
      const filePath = `profile-pics/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        // If bucket doesn't exist or other error, show message
        console.error('Upload error:', uploadError)
        error('Failed to upload image. Storage may not be configured.')
        return
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath)

      // Update volunteer profile with new picture URL
      const { error: updateError } = await supabase
        .from('volunteers')
        .update({ profile_pic: publicUrl })
        .eq('id', currentUser.volunteer_id)

      if (updateError) throw updateError

      setProfileData({ ...profileData, profile_pic: publicUrl })
      success('Profile picture updated successfully!')
    } catch (err: any) {
      console.error('Error uploading profile picture:', err)
      error(err.message || 'Failed to upload profile picture')
    } finally {
      setUploading(false)
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!validateRequired(profileData.first_name)) {
      newErrors.first_name = 'First name is required'
    }

    if (!validateRequired(profileData.last_name)) {
      newErrors.last_name = 'Last name is required'
    }

    if (!validateEmail(profileData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (profileData.phone_no && !validatePhone(profileData.phone_no)) {
      newErrors.phone_no = 'Please enter a valid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm() || !currentUser?.volunteer_id) {
      error('Please fix the errors before saving')
      return
    }

    try {
      setSaving(true)

      const { error: updateError } = await supabase
        .from('volunteers')
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone_no: profileData.phone_no,
          address: profileData.address,
          gender: profileData.gender,
        })
        .eq('id', currentUser.volunteer_id)

      if (updateError) throw updateError

      success('Profile saved successfully!')
      setErrors({})
    } catch (err: any) {
      console.error('Error saving profile:', err)
      error(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: 'fas fa-user' },
    { id: 'activity', name: 'Activity', icon: 'fas fa-chart-line' },
    { id: 'history', name: 'History', icon: 'fas fa-history' },
    { id: 'preferences', name: 'Preferences', icon: 'fas fa-sliders-h' },
  ]

  const getRoleDisplay = () => {
    if (!currentUser?.roles?.length) return 'Volunteer'
    if (currentUser.roles.includes('admin')) return 'Administrator'
    if (currentUser.roles.includes('program_officer')) return 'Program Officer'
    if (currentUser.roles.includes('documentation_lead')) return 'Documentation Lead'
    if (currentUser.roles.includes('event_lead')) return 'Event Lead'
    return 'Volunteer'
  }

  if (loading) {
    return (
      <div
        className={`flex-1 overflow-x-hidden overflow-y-auto main-content-bg ${layout.getContentPadding()}`}
      >
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-48 rounded-xl mb-6" />
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex-1 overflow-x-hidden overflow-y-auto main-content-bg mobile-scroll safe-area-bottom ${layout.getContentPadding()}`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="card-glass rounded-xl p-6 mb-6">
          <div className={`flex ${layout.isMobile ? 'flex-col' : 'flex-row'} items-center gap-6`}>
            <div className="relative">
              {profileData.profile_pic ? (
                <Image
                  src={profileData.profile_pic}
                  alt="Profile Picture"
                  width={layout.isMobile ? 96 : 128}
                  height={layout.isMobile ? 96 : 128}
                  className={`${layout.isMobile ? 'w-24 h-24' : 'w-32 h-32'} rounded-full border-4 border-gray-700/50 object-cover`}
                />
              ) : (
                <div
                  className={`${layout.isMobile ? 'w-24 h-24' : 'w-32 h-32'} rounded-full border-4 border-gray-700/50 bg-indigo-600 flex items-center justify-center`}
                >
                  <span className="text-3xl font-bold text-white">
                    {profileData.first_name?.charAt(0)}
                    {profileData.last_name?.charAt(0)}
                  </span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={handleAvatarClick}
                disabled={uploading}
                className="absolute bottom-0 right-0 pwa-button bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-lg focus-visible disabled:opacity-50"
              >
                {uploading ? (
                  <i className="fas fa-spinner fa-spin text-sm"></i>
                ) : (
                  <i className="fas fa-camera text-sm"></i>
                )}
              </button>
            </div>

            <div className={`flex-1 ${layout.isMobile ? 'text-center' : 'text-left'}`}>
              <h1
                className={`${layout.isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-100 mb-2`}
              >
                {profileData.first_name} {profileData.last_name}
              </h1>
              <p className="text-lg text-gray-300 mb-2">{getRoleDisplay()}</p>
              <p className="text-sm text-gray-400 mb-4">
                {profileData.branch} - Year {profileData.year} | {profileData.roll_number}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap justify-center md:justify-start">
                {Number(profileData.nss_join_year || 0) > 0 && (
                  <span>
                    <i className="fas fa-calendar mr-1"></i> NSS since {profileData.nss_join_year}
                  </span>
                )}
                <span>
                  <i className="fas fa-envelope mr-1"></i> {profileData.email}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={`grid ${layout.isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-4 mb-6`}>
          <div className="card-glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">{stats.eventsParticipated}</div>
            <div className="text-sm text-gray-400">Events Participated</div>
          </div>
          <div className="card-glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">{stats.totalHours}</div>
            <div className="text-sm text-gray-400">Total Hours</div>
          </div>
          <div className="card-glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">{stats.approvedHours}</div>
            <div className="text-sm text-gray-400">Approved Hours</div>
          </div>
          <div className="card-glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-orange-400 mb-1">{stats.pendingReviews}</div>
            <div className="text-sm text-gray-400">Pending Reviews</div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="card-glass rounded-xl overflow-hidden">
          <div className="flex border-b border-gray-700/30 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-all focus-visible whitespace-nowrap min-w-[100px] ${
                  activeTab === tab.id
                    ? 'bg-indigo-600/20 text-indigo-400 border-b-2 border-indigo-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
                }`}
              >
                <i className={`${tab.icon} fa-sm`}></i>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profileData.first_name}
                        onChange={(e) => {
                          setProfileData({ ...profileData, first_name: e.target.value })
                          if (errors.first_name) setErrors({ ...errors, first_name: '' })
                        }}
                        className={`input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible ${errors.first_name ? 'border-2 border-red-500' : ''}`}
                      />
                      {errors.first_name && (
                        <p className="text-red-400 text-xs mt-1">{errors.first_name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profileData.last_name}
                        onChange={(e) => {
                          setProfileData({ ...profileData, last_name: e.target.value })
                          if (errors.last_name) setErrors({ ...errors, last_name: '' })
                        }}
                        className={`input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible ${errors.last_name ? 'border-2 border-red-500' : ''}`}
                      />
                      {errors.last_name && (
                        <p className="text-red-400 text-xs mt-1">{errors.last_name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none opacity-60 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone_no}
                        onChange={(e) => {
                          setProfileData({ ...profileData, phone_no: e.target.value })
                          if (errors.phone_no) setErrors({ ...errors, phone_no: '' })
                        }}
                        className={`input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible ${errors.phone_no ? 'border-2 border-red-500' : ''}`}
                      />
                      {errors.phone_no && (
                        <p className="text-red-400 text-xs mt-1">{errors.phone_no}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Roll Number
                      </label>
                      <input
                        type="text"
                        value={profileData.roll_number}
                        disabled
                        className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none opacity-60 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Branch</label>
                      <input
                        type="text"
                        value={profileData.branch}
                        disabled
                        className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none opacity-60 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
                      <select
                        value={profileData.gender}
                        onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                        className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={profileData.birth_date?.split('T')[0] || ''}
                        disabled
                        className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none opacity-60 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                  <textarea
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    rows={3}
                    className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
                    placeholder="Enter your address..."
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="pwa-button button-glass-primary hover-lift flex items-center space-x-2 px-6 py-2 rounded-lg text-sm font-medium focus-visible disabled:opacity-50"
                  >
                    {saving ? (
                      <i className="fas fa-spinner fa-spin fa-sm"></i>
                    ) : (
                      <i className="fas fa-save fa-sm"></i>
                    )}
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">
                    Activity Chart - Last 6 Months
                  </h3>
                  <div className="h-64 bg-gray-800/30 rounded-lg p-4">
                    {monthlyActivity.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={monthlyActivity}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="month" stroke="#9ca3af" />
                          <YAxis stroke="#9ca3af" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(17, 24, 39, 0.95)',
                              border: '1px solid rgba(75, 85, 99, 0.5)',
                              borderRadius: '8px',
                              color: '#f3f4f6',
                            }}
                          />
                          <Bar
                            dataKey="events"
                            name="Events"
                            fill="#6366f1"
                            radius={[8, 8, 0, 0]}
                          />
                          <Bar dataKey="hours" name="Hours" fill="#10b981" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <i className="fas fa-chart-bar text-4xl mb-3"></i>
                          <p>No activity data available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">Statistics Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-800/30 rounded-lg p-4">
                      <div className="text-2xl font-bold text-indigo-400">
                        {stats.eventsParticipated}
                      </div>
                      <div className="text-sm text-gray-400">Total Events</div>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-400">{stats.totalHours}</div>
                      <div className="text-sm text-gray-400">Total Hours</div>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-400">
                        {stats.approvedHours}
                      </div>
                      <div className="text-sm text-gray-400">Approved Hours</div>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-4">
                      <div className="text-2xl font-bold text-yellow-400">
                        {stats.totalHours > 0
                          ? Math.round((stats.approvedHours / stats.totalHours) * 100)
                          : 0}
                        %
                      </div>
                      <div className="text-sm text-gray-400">Approval Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-100 mb-4">Participation History</h3>

                {participationHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-history text-4xl text-gray-600 mb-3"></i>
                    <p className="text-gray-400">No participation history yet</p>
                    <p className="text-sm text-gray-500">
                      Register for events to start building your history!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {participationHistory.map((item, index) => (
                      <div
                        key={`${item.event_id}-${index}`}
                        className="bg-gray-800/30 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-100">{item.event_name}</h4>
                            <p className="text-sm text-gray-400">
                              {new Date(item.event_date).toLocaleDateString()} •{' '}
                              {item.category_name}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.approval_status === 'approved'
                                ? 'bg-green-500/20 text-green-400'
                                : item.approval_status === 'rejected'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                            }`}
                          >
                            {item.approval_status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-400">
                            <i className="fas fa-clock mr-1"></i>
                            {item.hours_attended}h attended
                          </span>
                          {item.approved_hours !== null && (
                            <span className="text-green-400">
                              <i className="fas fa-check-circle mr-1"></i>
                              {item.approved_hours}h approved
                            </span>
                          )}
                          <span
                            className={`${
                              item.participation_status === 'attended' ||
                              item.participation_status === 'present'
                                ? 'text-green-400'
                                : item.participation_status === 'absent'
                                  ? 'text-red-400'
                                  : 'text-blue-400'
                            }`}
                          >
                            {item.participation_status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">
                    Notification Preferences
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    These preferences are stored locally and will be saved when the settings feature
                    is fully implemented.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-300">
                          Email Notifications
                        </label>
                        <p className="text-xs text-gray-500">Receive notifications via email</p>
                      </div>
                      <button
                        onClick={() =>
                          setPreferences({
                            ...preferences,
                            emailNotifications: !preferences.emailNotifications,
                          })
                        }
                        className={`toggle-switch ${preferences.emailNotifications ? 'active' : ''}`}
                      >
                        <span className="toggle-slider"></span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-300">
                          SMS Notifications
                        </label>
                        <p className="text-xs text-gray-500">Receive notifications via SMS</p>
                      </div>
                      <button
                        onClick={() =>
                          setPreferences({
                            ...preferences,
                            smsNotifications: !preferences.smsNotifications,
                          })
                        }
                        className={`toggle-switch ${preferences.smsNotifications ? 'active' : ''}`}
                      >
                        <span className="toggle-slider"></span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-300">Event Reminders</label>
                        <p className="text-xs text-gray-500">Get reminded about upcoming events</p>
                      </div>
                      <button
                        onClick={() =>
                          setPreferences({
                            ...preferences,
                            eventReminders: !preferences.eventReminders,
                          })
                        }
                        className={`toggle-switch ${preferences.eventReminders ? 'active' : ''}`}
                      >
                        <span className="toggle-slider"></span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-300">Newsletter</label>
                        <p className="text-xs text-gray-500">Receive monthly newsletter</p>
                      </div>
                      <button
                        onClick={() =>
                          setPreferences({
                            ...preferences,
                            newsletter: !preferences.newsletter,
                          })
                        }
                        className={`toggle-switch ${preferences.newsletter ? 'active' : ''}`}
                      >
                        <span className="toggle-slider"></span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
