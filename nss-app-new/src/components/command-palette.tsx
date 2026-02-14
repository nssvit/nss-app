'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart3,
  Calendar,
  ClipboardCheck,
  Clock,
  Home,
  LogOut,
  Settings,
  Shield,
  Tags,
  User,
  Users,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'

const navCommands = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Events', href: '/events', icon: Calendar },
  { label: 'Volunteers', href: '/volunteers', icon: Users },
  { label: 'Hours Approval', href: '/hours-approval', icon: Clock },
  { label: 'Attendance', href: '/attendance', icon: ClipboardCheck },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Role Management', href: '/role-management', icon: Shield },
  { label: 'Categories', href: '/categories', icon: Tags },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const runCommand = useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {navCommands.map((cmd) => (
            <CommandItem key={cmd.href} onSelect={() => runCommand(() => router.push(cmd.href))}>
              <cmd.icon className="mr-2 size-4" />
              {cmd.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runCommand(() => router.push('/events'))}>
            <Calendar className="mr-2 size-4" />
            Create Event
          </CommandItem>
          <CommandItem onSelect={() => {
            setOpen(false)
            const supabase = createClient()
            supabase.auth.signOut().then(() => router.push('/login'))
          }}>
            <LogOut className="mr-2 size-4" />
            Sign Out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
