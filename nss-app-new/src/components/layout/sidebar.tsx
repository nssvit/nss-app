'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PanelLeftClose, PanelLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { navItems, type NavItem } from './nav-config'

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

function NavSection({
  title,
  items,
  collapsed,
}: {
  title: string
  items: NavItem[]
  collapsed: boolean
}) {
  if (items.length === 0) return null
  return (
    <div className="space-y-1">
      {!collapsed && (
        <p className="text-muted-foreground px-3 py-1 text-xs font-semibold tracking-wider uppercase">
          {title}
        </p>
      )}
      {collapsed && <Separator className="my-2" />}
      {items.map((item) => (
        <NavLink key={item.href} item={item} collapsed={collapsed} />
      ))}
    </div>
  )
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  // TODO: filter by user roles once auth is wired
  const mainItems = navItems.filter((i) => i.section === 'main')
  const managementItems = navItems.filter((i) => i.section === 'management')
  const adminItems = navItems.filter((i) => i.section === 'admin')

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

      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        <NavSection title="Main" items={mainItems} collapsed={collapsed} />
        <NavSection title="Management" items={managementItems} collapsed={collapsed} />
        <NavSection title="Admin" items={adminItems} collapsed={collapsed} />
      </nav>
    </aside>
  )
}
