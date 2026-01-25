'use client'

import { useState, useEffect } from 'react'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/contexts/AuthContext'
import { ToastContainer } from '@/components/ui'
import { validateEmail, validateRequired } from '@/utils/validation'

const SETTINGS_KEY = 'nss_app_settings'

interface AppSettings {
  general: {
    organizationName: string
    email: string
    timezone: string
    language: string
  }
  notifications: {
    emailNotifications: boolean
    pushNotifications: boolean
    smsNotifications: boolean
    eventReminders: boolean
    reportAlerts: boolean
  }
  security: {
    twoFactorAuth: boolean
    passwordExpiry: string
    sessionTimeout: string
    loginAttempts: string
  }
  privacy: {
    dataRetention: string
    analyticsEnabled: boolean
    dataBackup: boolean
  }
}

const defaultSettings: AppSettings = {
  general: {
    organizationName: 'NSS VIT',
    email: 'nss@vit.ac.in',
    timezone: 'Asia/Kolkata',
    language: 'en',
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    eventReminders: true,
    reportAlerts: true,
  },
  security: {
    twoFactorAuth: false,
    passwordExpiry: '90',
    sessionTimeout: '60',
    loginAttempts: '5',
  },
  privacy: {
    dataRetention: '365',
    analyticsEnabled: true,
    dataBackup: true,
  },
}

export function SettingsPage() {
  const layout = useResponsiveLayout()
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('general')
  const { toasts, removeToast, success, error } = useToast()
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  // Load settings from localStorage on mount
  useEffect(() => {
    loadSettings()
  }, [currentUser])

  const loadSettings = () => {
    try {
      const userId = currentUser?.volunteer_id || 'default'
      const storageKey = `${SETTINGS_KEY}_${userId}`
      const savedSettings = localStorage.getItem(storageKey)

      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        // Merge with defaults to handle any new settings
        setSettings({
          general: { ...defaultSettings.general, ...parsed.general },
          notifications: { ...defaultSettings.notifications, ...parsed.notifications },
          security: { ...defaultSettings.security, ...parsed.security },
          privacy: { ...defaultSettings.privacy, ...parsed.privacy },
        })
      }
    } catch (err) {
      console.error('Error loading settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = () => {
    try {
      const userId = currentUser?.volunteer_id || 'default'
      const storageKey = `${SETTINGS_KEY}_${userId}`
      localStorage.setItem(storageKey, JSON.stringify(settings))
      return true
    } catch (err) {
      console.error('Error saving settings:', err)
      return false
    }
  }

  const updateGeneralSetting = (key: keyof AppSettings['general'], value: string) => {
    setSettings((prev) => ({
      ...prev,
      general: { ...prev.general, [key]: value },
    }))
    if (errors[key]) {
      setErrors({ ...errors, [key]: '' })
    }
  }

  const updateNotificationSetting = (key: keyof AppSettings['notifications'], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }))
  }

  const updateSecuritySetting = (key: keyof AppSettings['security'], value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      security: { ...prev.security, [key]: value },
    }))
  }

  const updatePrivacySetting = (key: keyof AppSettings['privacy'], value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      privacy: { ...prev.privacy, [key]: value },
    }))
  }

  const tabs = [
    { id: 'general', name: 'General', icon: 'fas fa-cog' },
    { id: 'notifications', name: 'Notifications', icon: 'fas fa-bell' },
    { id: 'security', name: 'Security', icon: 'fas fa-shield-alt' },
    { id: 'privacy', name: 'Privacy', icon: 'fas fa-lock' },
    { id: 'integrations', name: 'Integrations', icon: 'fas fa-plug' },
    { id: 'backup', name: 'Backup', icon: 'fas fa-database' },
  ]

  const validateSettings = () => {
    const newErrors: { [key: string]: string } = {}

    if (!validateRequired(settings.general.organizationName)) {
      newErrors.organizationName = 'Organization name is required'
    }

    if (!validateEmail(settings.general.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (activeTab === 'general' && !validateSettings()) {
      error('Please fix the errors before saving')
      return
    }

    if (saveSettings()) {
      success('Settings saved successfully!')
      setErrors({})
    } else {
      error('Failed to save settings')
    }
  }

  if (loading) {
    return (
      <div
        className={`flex-1 overflow-x-hidden overflow-y-auto main-content-bg ${layout.getContentPadding()}`}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading settings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex-1 overflow-x-hidden overflow-y-auto main-content-bg mobile-scroll safe-area-bottom ${layout.getContentPadding()}`}
    >
      {/* Settings Navigation */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className={`${layout.isMobile ? 'w-full' : 'w-64'} flex-shrink-0`}>
          <div className="card-glass rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Settings</h3>
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all focus-visible ${
                    activeTab === tab.id
                      ? 'bg-indigo-600/20 text-indigo-400 border-l-2 border-indigo-400'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
                  }`}
                >
                  <i className={`${tab.icon} w-4 text-center`}></i>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="card-glass rounded-xl p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">General Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Organization Name
                      </label>
                      <input
                        type="text"
                        value={settings.general.organizationName}
                        onChange={(e) => updateGeneralSetting('organizationName', e.target.value)}
                        className={`input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible ${errors.organizationName ? 'border-2 border-red-500' : ''}`}
                      />
                      {errors.organizationName && (
                        <p className="text-red-400 text-xs mt-1">{errors.organizationName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={settings.general.email}
                        onChange={(e) => updateGeneralSetting('email', e.target.value)}
                        className={`input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible ${errors.email ? 'border-2 border-red-500' : ''}`}
                      />
                      {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Timezone
                      </label>
                      <select
                        value={settings.general.timezone}
                        onChange={(e) => updateGeneralSetting('timezone', e.target.value)}
                        className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Language
                      </label>
                      <select
                        value={settings.general.language}
                        onChange={(e) => updateGeneralSetting('language', e.target.value)}
                        className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="ta">Tamil</option>
                        <option value="te">Telugu</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">
                    Notification Settings
                  </h3>
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
                          updateNotificationSetting(
                            'emailNotifications',
                            !settings.notifications.emailNotifications
                          )
                        }
                        className={`toggle-switch ${settings.notifications.emailNotifications ? 'active' : ''}`}
                      >
                        <span className="toggle-slider"></span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-300">
                          Push Notifications
                        </label>
                        <p className="text-xs text-gray-500">
                          Receive push notifications in browser
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updateNotificationSetting(
                            'pushNotifications',
                            !settings.notifications.pushNotifications
                          )
                        }
                        className={`toggle-switch ${settings.notifications.pushNotifications ? 'active' : ''}`}
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
                          updateNotificationSetting(
                            'smsNotifications',
                            !settings.notifications.smsNotifications
                          )
                        }
                        className={`toggle-switch ${settings.notifications.smsNotifications ? 'active' : ''}`}
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
                          updateNotificationSetting(
                            'eventReminders',
                            !settings.notifications.eventReminders
                          )
                        }
                        className={`toggle-switch ${settings.notifications.eventReminders ? 'active' : ''}`}
                      >
                        <span className="toggle-slider"></span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-300">Report Alerts</label>
                        <p className="text-xs text-gray-500">
                          Receive alerts when reports are ready
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updateNotificationSetting(
                            'reportAlerts',
                            !settings.notifications.reportAlerts
                          )
                        }
                        className={`toggle-switch ${settings.notifications.reportAlerts ? 'active' : ''}`}
                      >
                        <span className="toggle-slider"></span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">Security Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-300">
                          Two-Factor Authentication
                        </label>
                        <p className="text-xs text-gray-500">Add extra security to your account</p>
                      </div>
                      <button
                        onClick={() =>
                          updateSecuritySetting('twoFactorAuth', !settings.security.twoFactorAuth)
                        }
                        className={`toggle-switch ${settings.security.twoFactorAuth ? 'active' : ''}`}
                      >
                        <span className="toggle-slider"></span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Password Expiry (days)
                        </label>
                        <input
                          type="number"
                          value={settings.security.passwordExpiry}
                          onChange={(e) => updateSecuritySetting('passwordExpiry', e.target.value)}
                          className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Session Timeout (minutes)
                        </label>
                        <input
                          type="number"
                          value={settings.security.sessionTimeout}
                          onChange={(e) => updateSecuritySetting('sessionTimeout', e.target.value)}
                          className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Max Login Attempts
                        </label>
                        <input
                          type="number"
                          value={settings.security.loginAttempts}
                          onChange={(e) => updateSecuritySetting('loginAttempts', e.target.value)}
                          className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Settings */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">
                    Privacy & Data Settings
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Data Retention Period (days)
                      </label>
                      <input
                        type="number"
                        value={settings.privacy.dataRetention}
                        onChange={(e) => updatePrivacySetting('dataRetention', e.target.value)}
                        className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-300">
                          Analytics Tracking
                        </label>
                        <p className="text-xs text-gray-500">Allow analytics data collection</p>
                      </div>
                      <button
                        onClick={() =>
                          updatePrivacySetting(
                            'analyticsEnabled',
                            !settings.privacy.analyticsEnabled
                          )
                        }
                        className={`toggle-switch ${settings.privacy.analyticsEnabled ? 'active' : ''}`}
                      >
                        <span className="toggle-slider"></span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-300">
                          Automatic Backups
                        </label>
                        <p className="text-xs text-gray-500">Enable automatic data backups</p>
                      </div>
                      <button
                        onClick={() =>
                          updatePrivacySetting('dataBackup', !settings.privacy.dataBackup)
                        }
                        className={`toggle-switch ${settings.privacy.dataBackup ? 'active' : ''}`}
                      >
                        <span className="toggle-slider"></span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">Integrations</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-200">Google Calendar</h4>
                          <p className="text-xs text-gray-500">Sync events with Google Calendar</p>
                        </div>
                        <button className="pwa-button button-glass-secondary px-3 py-1 text-sm rounded focus-visible">
                          Connect
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-200">Slack</h4>
                          <p className="text-xs text-gray-500">Send notifications to Slack</p>
                        </div>
                        <button className="pwa-button button-glass-secondary px-3 py-1 text-sm rounded focus-visible">
                          Connect
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-200">Microsoft Teams</h4>
                          <p className="text-xs text-gray-500">Integrate with Microsoft Teams</p>
                        </div>
                        <button className="pwa-button button-glass-secondary px-3 py-1 text-sm rounded focus-visible">
                          Connect
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Backup Settings */}
            {activeTab === 'backup' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">Backup & Export</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                      <h4 className="font-medium text-gray-200 mb-2">Database Backup</h4>
                      <p className="text-sm text-gray-400 mb-3">
                        Last backup: {new Date().toLocaleDateString()} at{' '}
                        {new Date().toLocaleTimeString()}
                      </p>
                      <div className="flex space-x-2">
                        <button className="pwa-button button-glass-primary px-4 py-2 text-sm rounded focus-visible">
                          Create Backup
                        </button>
                        <button className="pwa-button button-glass-secondary px-4 py-2 text-sm rounded focus-visible">
                          Download
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                      <h4 className="font-medium text-gray-200 mb-2">Export Data</h4>
                      <p className="text-sm text-gray-400 mb-3">
                        Export all your data in various formats
                      </p>
                      <div className="flex space-x-2">
                        <button className="pwa-button button-glass-secondary px-4 py-2 text-sm rounded focus-visible">
                          Export CSV
                        </button>
                        <button className="pwa-button button-glass-secondary px-4 py-2 text-sm rounded focus-visible">
                          Export JSON
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-gray-700/30">
              <button
                onClick={handleSave}
                className="pwa-button button-glass-primary hover-lift flex items-center space-x-2 px-6 py-2 rounded-lg text-sm font-medium focus-visible"
              >
                <i className="fas fa-save fa-sm"></i>
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
