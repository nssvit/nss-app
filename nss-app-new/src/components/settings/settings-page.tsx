'use client'

import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function SettingsPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [notifications, setNotifications] = useState({
    email: true,
    events: true,
    approvals: false,
  })

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    document.documentElement.classList.toggle('light', next === 'light')
  }

  function toggleNotification(key: keyof typeof notifications) {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Application settings and preferences." />

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how the application looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-muted-foreground text-sm">Switch between dark and light mode</p>
            </div>
            <Button variant="outline" size="sm" onClick={toggleTheme}>
              {theme === 'dark' ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                key: 'email' as const,
                label: 'Email Notifications',
                description: 'Receive email updates about your account',
              },
              {
                key: 'events' as const,
                label: 'Event Notifications',
                description: 'Get notified about new events and registrations',
              },
              {
                key: 'approvals' as const,
                label: 'Approval Notifications',
                description: 'Get notified when your hours are approved or rejected',
              },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </div>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={notifications[item.key]}
                  onClick={() => toggleNotification(item.key)}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                    notifications[item.key] ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
                      notifications[item.key] ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
