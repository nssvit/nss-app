'use client'

import Link from 'next/link'
import { Moon, Sun, Menu, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useTheme } from '@/contexts/theme-context'
import { useAuth } from '@/contexts/auth-context'

interface HeaderProps {
  onMobileMenuOpen: () => void
}

export function Header({ onMobileMenuOpen }: HeaderProps) {
  const { toggleTheme } = useTheme()
  const { currentUser, signOut } = useAuth()

  const initials = currentUser ? `${currentUser.firstName[0]}${currentUser.lastName[0]}` : 'U'

  return (
    <header className="bg-background/80 border-b backdrop-blur-sm">
      <div className="flex h-14 items-center gap-4 px-4">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMobileMenuOpen}>
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hidden gap-2 text-sm md:flex"
          onClick={() =>
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
          }
        >
          <Search className="size-4" />
          <span>Search</span>
          <kbd className="bg-muted text-muted-foreground pointer-events-none ml-2 inline-flex h-5 items-center rounded border px-1.5 font-mono text-xs">
            ⌘K
          </kbd>
        </Button>

        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
