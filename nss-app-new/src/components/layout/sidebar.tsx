'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PanelLeftClose, PanelLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { getFilteredNavItems, type NavItem } from './nav-config'
import { useAuth } from '@/contexts/auth-context'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname()
  const isActive = pathname === item.href

  const link = (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        collapsed && 'justify-center px-2'
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    )
  }

  return link
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { currentUser } = useAuth()
  const userRoles = currentUser?.roles ?? []
  const filtered = getFilteredNavItems(userRoles)

  const mainItems = filtered.filter((i) => i.section === 'main')
  const managementItems = filtered.filter((i) => i.section === 'management')
  const adminItems = filtered.filter((i) => i.section === 'admin')

  return (
    <aside
      className={cn(
        'bg-sidebar border-sidebar-border flex h-screen flex-col border-r transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-14 items-center justify-between px-4">
        {!collapsed && <span className="text-lg font-bold">NSS App</span>}
        <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {mainItems.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} />
        ))}
        {managementItems.length > 0 && (
          <>
            <Separator className="my-2" />
            {managementItems.map((item) => (
              <NavLink key={item.href} item={item} collapsed={collapsed} />
            ))}
          </>
        )}
        {adminItems.length > 0 && (
          <>
            <Separator className="my-2" />
            {adminItems.map((item) => (
              <NavLink key={item.href} item={item} collapsed={collapsed} />
            ))}
          </>
        )}
      </nav>
    </aside>
  )
}
