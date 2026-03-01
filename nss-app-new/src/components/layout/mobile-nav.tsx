'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { getFilteredNavItems } from './nav-config'
import { useAuth } from '@/contexts/auth-context'

interface MobileNavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname()
  const { currentUser } = useAuth()
  const userRoles = currentUser?.roles ?? []
  const filtered = getFilteredNavItems(userRoles)

  const mainItems = filtered.filter((i) => i.section === 'main')
  const managementItems = filtered.filter((i) => i.section === 'management')
  const adminItems = filtered.filter((i) => i.section === 'admin')

  function renderLink(item: (typeof filtered)[0]) {
    const isActive = pathname === item.href
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => onOpenChange(false)}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <item.icon className="h-5 w-5" />
        <span>{item.label}</span>
      </Link>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] max-w-[85vw] p-0">
        <SheetHeader className="px-4 pt-4">
          <SheetTitle className="text-sm font-semibold tracking-tight pb-1">NSS App</SheetTitle>
        </SheetHeader>
        <Separator className="my-2" />
        <nav className="space-y-1 px-3 py-2">
          {mainItems.map(renderLink)}
          {managementItems.length > 0 && (
            <>
              <Separator className="my-2" />
              {managementItems.map(renderLink)}
            </>
          )}
          {adminItems.length > 0 && (
            <>
              <Separator className="my-2" />
              {adminItems.map(renderLink)}
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
