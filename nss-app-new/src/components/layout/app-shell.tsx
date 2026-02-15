'use client'

import { useState } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PageTitleProvider } from '@/contexts/page-title-context'
import { useSidebar } from '@/hooks/use-sidebar'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { MobileNav } from './mobile-nav'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { collapsed, toggle } = useSidebar()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <TooltipProvider>
      <PageTitleProvider>
        <div className="flex h-screen overflow-hidden">
          <div className="hidden md:block">
            <Sidebar collapsed={collapsed} onToggle={toggle} />
          </div>
          <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header onMobileMenuOpen={() => setMobileOpen(true)} />
            <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
          </div>
        </div>
      </PageTitleProvider>
    </TooltipProvider>
  )
}
