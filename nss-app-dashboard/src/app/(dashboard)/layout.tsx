'use client'

/**
 * Dashboard Layout
 * Shared layout for all dashboard routes (/admin, /officer, /volunteer)
 * Provides sidebar, header, and content area
 */

import { useState } from 'react'
import { Sidebar, UserProfileHeader } from '@/components/layout'
import { AuthGuard } from '@/components/auth'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { usePathname, useRouter } from 'next/navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const layout = useResponsiveLayout()

  // Map current route to sidebar active state
  const getActiveLink = () => {
    if (pathname.includes('/admin')) return 'admin'
    if (pathname.includes('/officer')) return 'officer'
    if (pathname.includes('/volunteer')) return 'volunteer'
    return 'dashboard'
  }

  const [activeLink, setActiveLink] = useState(getActiveLink())

  const handleNavigation = (link: string) => {
    setActiveLink(link)
    // Navigation is handled by Link components in Sidebar
  }

  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length === 0) return 'Dashboard'
    return segments[segments.length - 1]
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getPageIcon = () => {
    if (pathname.includes('/admin')) return 'fas fa-user-shield'
    if (pathname.includes('/officer')) return 'fas fa-clipboard-list'
    if (pathname.includes('/volunteer')) return 'fas fa-user'
    return 'fas fa-border-all'
  }

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          activeLink={activeLink}
          onLinkClick={handleNavigation}
          collapsed={layout.sidebarCollapsed}
          onToggle={layout.toggleSidebar}
          isMobile={layout.isMobile}
          showMobileMenu={layout.showMobileMenu}
          onToggleMobileMenu={layout.toggleMobileMenu}
          onCloseMobileMenu={layout.closeMobileMenu}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col header-bg">
          {/* Responsive Top Bar */}
          <header
            className={`flex items-center justify-between border-b border-gray-700/30 sticky top-0 z-20 header-bg safe-area-top ${
              layout.isMobile ? 'mobile-header px-4 py-3' : 'px-5 py-4 h-16'
            }`}
          >
            <div className="flex items-center space-x-3 h-8">
              {/* Mobile menu button */}
              {layout.isMobile && (
                <button
                  className="pwa-button text-gray-400 hover:text-gray-200 p-2 mr-2"
                  onClick={layout.toggleMobileMenu}
                >
                  <i className="fas fa-bars text-lg"></i>
                </button>
              )}
              <div className="flex items-center space-x-3">
                <i className={`${getPageIcon()} text-lg text-indigo-400`}></i>
                <h1
                  className={`font-semibold text-gray-100 ${layout.isMobile ? 'text-base' : 'text-lg'}`}
                >
                  NSS VIT{' '}
                  {!layout.isMobile && (
                    <>
                      / <span className="text-gray-400">{getPageTitle()}</span>
                    </>
                  )}
                </h1>
              </div>
            </div>

            {/* Header Actions */}
            <div className={`flex items-center ${layout.isMobile ? 'space-x-2' : 'space-x-3'}`}>
              <ThemeToggle />
              <button className="pwa-button action-button hover-lift text-gray-400 hover:text-gray-200 p-2 rounded-lg focus-visible">
                <i className={`far fa-bell ${layout.isMobile ? 'text-base' : 'fa-sm'}`}></i>
              </button>
              <UserProfileHeader />
            </div>
          </header>

          {/* Page Content */}
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
