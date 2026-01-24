'use client'

/**
 * ProfilePreferences Component
 * Notification preferences toggles
 */

import type { ProfilePreferences as Preferences } from './types'

interface ProfilePreferencesProps {
  preferences: Preferences
  onPreferenceChange: (key: keyof Preferences, value: boolean) => void
}

export function ProfilePreferences({ preferences, onPreferenceChange }: ProfilePreferencesProps) {
  const toggleItems = [
    {
      key: 'emailNotifications' as const,
      label: 'Email Notifications',
      description: 'Receive notifications via email',
    },
    {
      key: 'smsNotifications' as const,
      label: 'SMS Notifications',
      description: 'Receive notifications via SMS',
    },
    {
      key: 'eventReminders' as const,
      label: 'Event Reminders',
      description: 'Get reminded about upcoming events',
    },
    {
      key: 'newsletter' as const,
      label: 'Newsletter',
      description: 'Receive monthly newsletter',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Notification Preferences</h3>
        <p className="text-sm text-gray-400 mb-4">
          These preferences are stored locally and will be saved when the settings feature is fully
          implemented.
        </p>
        <div className="space-y-4">
          {toggleItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300">{item.label}</label>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
              <button
                onClick={() => onPreferenceChange(item.key, !preferences[item.key])}
                className={`toggle-switch ${preferences[item.key] ? 'active' : ''}`}
              >
                <span className="toggle-slider"></span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
