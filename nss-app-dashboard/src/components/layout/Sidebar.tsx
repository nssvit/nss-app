'use client'

import Image from 'next/image'

interface SidebarProps {
  activeLink: string
  onLinkClick: (link: string) => void
  collapsed: boolean
  onToggle: () => void
  isMobile?: boolean
  showMobileMenu?: boolean
  onToggleMobileMenu?: () => void
  onCloseMobileMenu?: () => void
}

export function Sidebar({
  activeLink,
  onLinkClick,
  collapsed,
  onToggle,
  isMobile = false,
  showMobileMenu = false,
  onToggleMobileMenu,
  onCloseMobileMenu,
}: SidebarProps) {
  const navigationLinks = [
    {
      href: 'dashboard',
      icon: 'fas fa-border-all',
      text: 'Dashboard',
      title: 'Dashboard',
    },
    {
      href: 'events',
      icon: 'fas fa-calendar-check',
      text: 'Events',
      title: 'Events',
    },
    {
      href: 'event-registration',
      icon: 'fas fa-clipboard-list',
      text: 'Event Registration',
      title: 'Register for Events',
    },
    {
      href: 'volunteers',
      icon: 'fas fa-users',
      text: 'Volunteers',
      title: 'Volunteers',
    },
    {
      href: 'attendance',
      icon: 'fas fa-user-check',
      text: 'Attendance',
      title: 'Attendance',
    },
    {
      href: 'reports',
      icon: 'fas fa-chart-pie',
      text: 'Reports',
      title: 'Reports',
    },
  ]

  const adminLinks = [
    {
      href: 'attendance-manager',
      icon: 'fas fa-user-check',
      text: 'Mark Attendance',
      title: 'Mark Event Attendance',
    },
    {
      href: 'hours-approval',
      icon: 'fas fa-clock',
      text: 'Hours Approval',
      title: 'Approve Volunteer Hours',
    },
    {
      href: 'role-management',
      icon: 'fas fa-user-tag',
      text: 'Role Management',
      title: 'Manage User Roles',
    },
    {
      href: 'categories',
      icon: 'fas fa-folder-open',
      text: 'Categories',
      title: 'Event Categories',
    },
    {
      href: 'user-management',
      icon: 'fas fa-user-shield',
      text: 'User Management',
      title: 'User Management',
    },
    {
      href: 'settings',
      icon: 'fas fa-cog',
      text: 'Settings',
      title: 'Settings',
    },
  ]

  // Mobile sidebar with overlay
  if (isMobile) {
    return (
      <>
        {/* Mobile overlay */}
        {showMobileMenu && <div className="mobile-sidebar-overlay" onClick={onCloseMobileMenu} />}

        {/* Mobile sidebar */}
        <aside className={`mobile-sidebar sidebar-bg ${showMobileMenu ? 'open' : ''}`}>
          <div className="safe-area-padding flex h-full flex-col">
            {/* Mobile Header */}
            <div className="sidebar-header-box mx-4 my-3 flex h-14 items-center justify-between px-4 py-3">
              <div className="branding-section flex h-7 items-center space-x-2">
                <Image
                  src="https://res.cloudinary.com/du6zyqqyw/image/upload/f_auto,q_auto,w_36/v1740557668/img/nss-logo.png"
                  alt="NSS Logo"
                  width={24}
                  height={24}
                  className="h-6"
                />
                <Image
                  src="https://res.cloudinary.com/du6zyqqyw/image/upload/f_auto,q_auto,w_90/v1740557668/img/vit-logo.png"
                  alt="VIT Logo"
                  width={40}
                  height={16}
                  className="h-4 opacity-85"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="pwa-button sidebar-toggle p-2 text-gray-400 hover:text-gray-200"
                  onClick={onToggleMobileMenu}
                >
                  <i className="fas fa-times text-lg"></i>
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            <div className="mobile-scroll flex flex-grow flex-col space-y-1 px-4">
              <nav className="flex-grow space-y-1 overflow-y-auto text-sm">
                {navigationLinks.map((link) => (
                  <a
                    key={link.href}
                    href={`#${link.href}`}
                    className={`flex items-center space-x-4 rounded-lg px-4 py-3 ${
                      activeLink === link.href
                        ? 'active-sidebar-link font-medium'
                        : 'sidebar-link text-gray-400'
                    }`}
                    title={link.title}
                    onClick={(e) => {
                      e.preventDefault()
                      onLinkClick(link.href)
                      onCloseMobileMenu?.()
                    }}
                  >
                    <i
                      className={`${link.icon} w-5 text-center text-base ${activeLink === link.href ? '' : 'text-gray-500'}`}
                    ></i>
                    <span>{link.text}</span>
                  </a>
                ))}

                <hr className="my-4 border-gray-700/30" />

                {adminLinks.map((link) => (
                  <a
                    key={link.href}
                    href={`#${link.href}`}
                    className={`flex items-center space-x-4 rounded-lg px-4 py-3 ${
                      activeLink === link.href
                        ? 'active-sidebar-link font-medium'
                        : 'sidebar-link text-gray-400'
                    }`}
                    title={link.title}
                    onClick={(e) => {
                      e.preventDefault()
                      onLinkClick(link.href)
                      onCloseMobileMenu?.()
                    }}
                  >
                    <i
                      className={`${link.icon} w-5 text-center text-base ${activeLink === link.href ? '' : 'text-gray-500'}`}
                    ></i>
                    <span>{link.text}</span>
                  </a>
                ))}
              </nav>

              {/* Mobile User Profile */}
              <div className="safe-area-bottom mt-auto border-t border-gray-700/30 pt-4">
                <a
                  href="#profile"
                  className="sidebar-link flex items-center space-x-3 rounded-lg px-4 py-3 text-gray-300"
                  title="Profile"
                  onClick={(e) => {
                    e.preventDefault()
                    onLinkClick('profile')
                    onCloseMobileMenu?.()
                  }}
                >
                  <div className="relative">
                    <Image
                      src="/icon-192x192.png"
                      alt="User Avatar"
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full"
                    />
                    <span className="avatar-status-dot-sidebar bg-green-500"></span>
                  </div>
                  <div className="flex flex-col text-sm">
                    <span className="font-medium text-gray-200">Admin</span>
                    <span className="text-xs text-gray-500">Admin</span>
                  </div>
                </a>
                <button
                  className="pwa-button mt-2 flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-sm text-gray-400 transition-all duration-200 hover:bg-red-900/30 hover:text-red-300"
                  title="Logout"
                >
                  <i className="fas fa-sign-out-alt w-5 text-center"></i>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </>
    )
  }

  // Desktop sidebar
  return (
    <aside
      className={`sidebar sidebar-bg ${collapsed ? 'collapsed' : 'w-56'} flex flex-shrink-0 flex-col`}
    >
      {/* Desktop Sidebar Header with Toggle */}
      <div className="sidebar-header-box mx-3 my-2 flex h-12 items-center justify-between px-3 py-2">
        <div className="branding-section flex h-7 items-center space-x-2">
          <Image
            src="https://res.cloudinary.com/du6zyqqyw/image/upload/f_auto,q_auto,w_36/v1740557668/img/nss-logo.png"
            alt="NSS Logo"
            width={20}
            height={20}
            className="logo-nss h-5"
          />
          <Image
            src="https://res.cloudinary.com/du6zyqqyw/image/upload/f_auto,q_auto,w_90/v1740557668/img/vit-logo.png"
            alt="VIT Logo"
            width={36}
            height={14}
            className="logo-vit h-3.5 opacity-85"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            className="sidebar-toggle focus-visible h-7 w-7 text-gray-400 hover:text-gray-200"
            onClick={onToggle}
          >
            <i className="fas fa-bars text-sm"></i>
          </button>
        </div>
      </div>

      {/* Desktop Navigation Section */}
      <div className="flex flex-grow flex-col space-y-1 px-3">
        <button
          onClick={() =>
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
          }
          className="group mb-2 flex w-full items-center space-x-3 rounded-lg px-3 py-2.5 text-left text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-200"
        >
          <i className="fas fa-search w-4 text-center transition-colors group-hover:text-white"></i>
          <span className="sidebar-text text-sm">
            Search...{' '}
            <span className="ml-2 rounded border border-gray-700 px-1 text-xs text-gray-600">
              ⌘K
            </span>
          </span>
        </button>
        <nav className="sidebar-nav-text flex-grow space-y-1 overflow-y-auto pr-1">
          {navigationLinks.map((link) => (
            <a
              key={link.href}
              href={`#${link.href}`}
              className={`focus-visible flex items-center space-x-3 rounded-lg px-3 py-2.5 ${
                activeLink === link.href
                  ? 'active-sidebar-link font-medium'
                  : 'sidebar-link text-gray-400'
              }`}
              title={link.title}
              onClick={(e) => {
                e.preventDefault()
                onLinkClick(link.href)
              }}
            >
              <i
                className={`${link.icon} w-4 text-center ${activeLink === link.href ? '' : 'text-gray-500'}`}
              ></i>
              <span className="sidebar-text">{link.text}</span>
            </a>
          ))}

          <hr className="sidebar-text my-3 border-gray-700/30" />

          {adminLinks.map((link) => (
            <a
              key={link.href}
              href={`#${link.href}`}
              className={`focus-visible flex items-center space-x-3 rounded-lg px-3 py-2.5 ${
                activeLink === link.href
                  ? 'active-sidebar-link font-medium'
                  : 'sidebar-link text-gray-400'
              }`}
              title={link.title}
              onClick={(e) => {
                e.preventDefault()
                onLinkClick(link.href)
              }}
            >
              <i
                className={`${link.icon} w-4 text-center ${activeLink === link.href ? '' : 'text-gray-500'}`}
              ></i>
              <span className="sidebar-text">{link.text}</span>
            </a>
          ))}
        </nav>

        {/* Desktop User Profile & Logout */}
        <div className="mt-auto border-t border-gray-700/30 pt-3">
          <a
            href="#profile"
            className="sidebar-link focus-visible flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-300"
            title="Profile"
            onClick={(e) => {
              e.preventDefault()
              onLinkClick('profile')
            }}
          >
            <div className="relative">
              <Image
                src="/icon-192x192.png"
                alt="User Avatar"
                width={28}
                height={28}
                className="h-7 w-7 rounded-full"
              />
              <span className="avatar-status-dot-sidebar bg-green-500"></span>
            </div>
            <div className="sidebar-text flex flex-col text-[0.7rem]">
              <span className="font-medium text-gray-200">Admin</span>
              <span className="text-gray-500">Admin</span>
            </div>
          </a>
          <button
            className="focus-visible mt-2 flex w-full items-center space-x-3 rounded-lg px-3 py-2.5 text-xs text-gray-400 transition-all duration-200 hover:bg-red-900/30 hover:text-red-300"
            title="Logout"
          >
            <i className="fas fa-sign-out-alt w-4 text-center"></i>
            <span className="sidebar-text">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
