'use client'

import { useState } from 'react'
import { User, Bell, Palette } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/auth-context'
import { useTheme } from '@/contexts/theme-context'
import { ROLE_DISPLAY_NAMES, ROLE_COLORS, type Role } from '@/lib/constants'
import { cn } from '@/lib/utils'

const notificationItems = [
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
]

export function SettingsPage() {
  const { currentUser } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [notifications, setNotifications] = useState({
    email: true,
    events: true,
    approvals: false,
  })

  function toggleNotification(key: keyof typeof notifications) {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Application settings and preferences." />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Account
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent>
          {currentUser && (
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  {currentUser.firstName[0]}
                  {currentUser.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">
                  {currentUser.firstName} {currentUser.lastName}
                </p>
                <p className="text-muted-foreground text-sm">{currentUser.email}</p>
              </div>
              <div className="flex gap-1">
                {currentUser.roles.map((role) => (
                  <Badge key={role} className={cn(ROLE_COLORS[role as Role])}>
                    {ROLE_DISPLAY_NAMES[role as Role] ?? role}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </CardTitle>
          <CardDescription>Customize how the application looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <p className="text-muted-foreground text-sm">Toggle between dark and light themes</p>
            </div>
            <Switch
              id="dark-mode"
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationItems.map((item, i) => (
            <div key={item.key}>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor={item.key}>{item.label}</Label>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </div>
                <Switch
                  id={item.key}
                  checked={notifications[item.key]}
                  onCheckedChange={() => toggleNotification(item.key)}
                />
              </div>
              {i < notificationItems.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
