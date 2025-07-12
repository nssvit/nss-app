'use client'

import { useState } from 'react'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'

export function SettingsPage() {
  const layout = useResponsiveLayout()
  const [activeTab, setActiveTab] = useState('general')
  
  // General Settings
  const [organizationName, setOrganizationName] = useState('NSS VIT')
  const [email, setEmail] = useState('nss@vit.ac.in')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [language, setLanguage] = useState('en')
  
  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [eventReminders, setEventReminders] = useState(true)
  const [reportAlerts, setReportAlerts] = useState(true)
  
  // Security Settings
  const [twoFactorAuth, setTwoFactorAuth] = useState(false)
  const [passwordExpiry, setPasswordExpiry] = useState('90')
  const [sessionTimeout, setSessionTimeout] = useState('60')
  const [loginAttempts, setLoginAttempts] = useState('5')
  
  // Data & Privacy
  const [dataRetention, setDataRetention] = useState('365')
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true)
  const [dataBckup, setDataBackup] = useState(true)

  const tabs = [
    { id: 'general', name: 'General', icon: 'fas fa-cog' },
    { id: 'notifications', name: 'Notifications', icon: 'fas fa-bell' },
    { id: 'security', name: 'Security', icon: 'fas fa-shield-alt' },
    { id: 'privacy', name: 'Privacy', icon: 'fas fa-lock' },
    { id: 'integrations', name: 'Integrations', icon: 'fas fa-plug' },
    { id: 'backup', name: 'Backup', icon: 'fas fa-database' }
  ]

  const handleSave = () => {
    // Save settings logic here
    console.log('Settings saved')
  }

  return (
    <div className={`flex-1 overflow-x-hidden overflow-y-auto main-content-bg mobile-scroll safe-area-bottom ${layout.getContentPadding()}`}>
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
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Timezone
                      </label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
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
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
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
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">Notification Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-300">Email Notifications</label>
                        <p className="text-xs text-gray-500">Receive notifications via email</p>
                      </div>
                      <button
                        onClick={() => setEmailNotifications(!emailNotifications)}
                        className={`toggle-switch ${emailNotifications ? 'active' : ''}`}
                      >
                        <span className="toggle-slider"></span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-300">Push Notifications</label>
                        <p className="text-xs text-gray-500">Receive push notifications in browser</p>
                      </div>
                      <button
                        onClick={() => setPushNotifications(!pushNotifications)}
                        className={`toggle-switch ${pushNotifications ? 'active' : ''}`}
                      >
                        <span className="toggle-slider"></span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-300">SMS Notifications</label>
                        <p className="text-xs text-gray-500">Receive notifications via SMS</p>
                      </div>
                      <button
                        onClick={() => setSmsNotifications(!smsNotifications)}
                        className={`toggle-switch ${smsNotifications ? 'active' : ''}`}
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
                        onClick={() => setEventReminders(!eventReminders)}
                        className={`toggle-switch ${eventReminders ? 'active' : ''}`}
                      >
                        <span className="toggle-slider"></span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-300">Report Alerts</label>
                        <p className="text-xs text-gray-500">Receive alerts when reports are ready</p>
                      </div>
                      <button
                        onClick={() => setReportAlerts(!reportAlerts)}
                        className={`toggle-switch ${reportAlerts ? 'active' : ''}`}
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
                        <label className="text-sm font-medium text-gray-300">Two-Factor Authentication</label>
                        <p className="text-xs text-gray-500">Add extra security to your account</p>
                      </div>
                      <button
                        onClick={() => setTwoFactorAuth(!twoFactorAuth)}
                        className={`toggle-switch ${twoFactorAuth ? 'active' : ''}`}
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
                          value={passwordExpiry}
                          onChange={(e) => setPasswordExpiry(e.target.value)}
                          className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Session Timeout (minutes)
                        </label>
                        <input
                          type="number"
                          value={sessionTimeout}
                          onChange={(e) => setSessionTimeout(e.target.value)}
                          className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Max Login Attempts
                        </label>
                        <input
                          type="number"
                          value={loginAttempts}
                          onChange={(e) => setLoginAttempts(e.target.value)}
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
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">Privacy & Data Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Data Retention Period (days)
                      </label>
                      <input
                        type="number"
                        value={dataRetention}
                        onChange={(e) => setDataRetention(e.target.value)}
                        className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-300">Analytics Tracking</label>
                        <p className="text-xs text-gray-500">Allow analytics data collection</p>
                      </div>
                      <button
                        onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                        className={`toggle-switch ${analyticsEnabled ? 'active' : ''}`}
                      >
                        <span className="toggle-slider"></span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-300">Automatic Backups</label>
                        <p className="text-xs text-gray-500">Enable automatic data backups</p>
                      </div>
                      <button
                        onClick={() => setDataBackup(!dataBckup)}
                        className={`toggle-switch ${dataBckup ? 'active' : ''}`}
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
                        Last backup: December 15, 2024 at 2:30 AM
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
    </div>
  )
} 