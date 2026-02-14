'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const { toggleTheme } = useTheme()
  const router = useRouter()
  const { signOut } = useAuth()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[20vh]">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setOpen(false)}
      />

      <Command className="command-palette animate-in fade-in zoom-in-95 relative w-full max-w-lg overflow-hidden rounded-xl border border-gray-700/50 shadow-2xl duration-200">
        <div className="flex items-center border-b border-gray-700/50 px-3" cmdk-input-wrapper="">
          <i className="fas fa-search mr-2 text-lg text-gray-400"></i>
          <Command.Input
            placeholder="Type a command or search..."
            className="flex h-14 w-full bg-transparent py-3 text-base text-gray-100 outline-none placeholder:text-gray-500"
          />
        </div>

        <Command.List className="max-h-[300px] scroll-py-2 overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-gray-500">
            No results found.
          </Command.Empty>

          <Command.Group
            heading="Navigation"
            className="mb-1 px-2 py-1.5 text-xs font-medium text-gray-500"
          >
            <Command.Item
              onSelect={() => runCommand(() => router.push('/dashboard'))}
              className="flex cursor-pointer items-center rounded-lg px-2 py-2.5 text-sm text-gray-200 transition-colors aria-selected:bg-indigo-500/20 aria-selected:text-indigo-300"
            >
              <i className="fas fa-border-all mr-2 w-5 text-center"></i>
              Dashboard
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => router.push('/events'))}
              className="flex cursor-pointer items-center rounded-lg px-2 py-2.5 text-sm text-gray-200 transition-colors aria-selected:bg-indigo-500/20 aria-selected:text-indigo-300"
            >
              <i className="fas fa-calendar-check mr-2 w-5 text-center"></i>
              Events
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => router.push('/volunteers'))}
              className="flex cursor-pointer items-center rounded-lg px-2 py-2.5 text-sm text-gray-200 transition-colors aria-selected:bg-indigo-500/20 aria-selected:text-indigo-300"
            >
              <i className="fas fa-users mr-2 w-5 text-center"></i>
              Volunteers
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => router.push('/reports'))}
              className="flex cursor-pointer items-center rounded-lg px-2 py-2.5 text-sm text-gray-200 transition-colors aria-selected:bg-indigo-500/20 aria-selected:text-indigo-300"
            >
              <i className="fas fa-chart-pie mr-2 w-5 text-center"></i>
              Reports
            </Command.Item>
          </Command.Group>

          <Command.Separator className="my-1 h-px bg-gray-700/50" />

          <Command.Group
            heading="Actions"
            className="mt-1 mb-1 px-2 py-1.5 text-xs font-medium text-gray-500"
          >
            <Command.Item
              onSelect={() => runCommand(() => toggleTheme())}
              className="flex cursor-pointer items-center rounded-lg px-2 py-2.5 text-sm text-gray-200 transition-colors aria-selected:bg-indigo-500/20 aria-selected:text-indigo-300"
            >
              <i className="fas fa-adjust mr-2 w-5 text-center"></i>
              Toggle Theme
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => console.log('Create Event'))}
              className="flex cursor-pointer items-center rounded-lg px-2 py-2.5 text-sm text-gray-200 transition-colors aria-selected:bg-indigo-500/20 aria-selected:text-indigo-300"
            >
              <i className="fas fa-plus mr-2 w-5 text-center"></i>
              Create New Event
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => signOut())}
              className="flex cursor-pointer items-center rounded-lg px-2 py-2.5 text-sm text-red-400 transition-colors aria-selected:bg-red-500/10 aria-selected:text-red-300"
            >
              <i className="fas fa-sign-out-alt mr-2 w-5 text-center"></i>
              Sign Out
            </Command.Item>
          </Command.Group>
        </Command.List>

        <div className="flex items-center justify-between border-t border-gray-700/50 bg-gray-800/30 px-4 py-2 text-[10px] text-gray-500">
          <div className="flex gap-2">
            <span>
              <kbd className="rounded bg-gray-700/50 px-1.5 py-0.5 text-gray-400">↵</kbd> to select
            </span>
            <span>
              <kbd className="rounded bg-gray-700/50 px-1.5 py-0.5 text-gray-400">↑↓</kbd> to
              navigate
            </span>
          </div>
          <span>
            <kbd className="rounded bg-gray-700/50 px-1.5 py-0.5 text-gray-400">esc</kbd> to close
          </span>
        </div>
      </Command>
    </div>
  )
}
