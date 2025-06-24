'use client'

import Image from 'next/image'

interface SidebarProps {
  activeLink: string
  onLinkClick: (link: string) => void
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ activeLink, onLinkClick, collapsed, onToggle }: SidebarProps) {
  const navigationLinks = [
    { href: "dashboard", icon: "fas fa-border-all", text: "Dashboard", title: "Dashboard" },
    { href: "events", icon: "fas fa-calendar-check", text: "Events", title: "Events" },
    { href: "volunteers", icon: "fas fa-users", text: "Volunteers", title: "Volunteers" },
    { href: "attendance", icon: "fas fa-user-check", text: "Attendance", title: "Attendance" },
    { href: "reports", icon: "fas fa-chart-pie", text: "Reports", title: "Reports" },
  ]

  const adminLinks = [
    { href: "user-management", icon: "fas fa-user-shield", text: "User Management", title: "User Management" },
    { href: "settings", icon: "fas fa-cog", text: "Settings", title: "Settings" },
  ]

  return (
    <aside className={`sidebar sidebar-bg ${collapsed ? 'collapsed' : 'w-56'} flex-shrink-0 flex flex-col`}>
      {/* Sidebar Header with Toggle */}
      <div className="sidebar-header-box flex items-center justify-between px-3 py-2 h-12 mx-3 my-2">
        <div className="branding-section flex items-center space-x-2 h-7">
          <Image 
            src="https://res.cloudinary.com/du6zyqqyw/image/upload/f_auto,q_auto,w_36/v1740557668/img/nss-logo.png" 
            alt="NSS Logo" 
            width={20}
            height={20}
            className="h-5" 
            style={{ transform: 'scale(1.01)' }}
          />
          <Image 
            src="https://res.cloudinary.com/du6zyqqyw/image/upload/f_auto,q_auto,w_90/v1740557668/img/vit-logo.png" 
            alt="VIT Logo" 
            width={36}
            height={14}
            className="h-3.5 opacity-85" 
            style={{ transform: 'scale(1.5)' }}
          />
        </div>
        <button 
          className="sidebar-toggle text-gray-400 hover:text-gray-200 h-7 w-7"
          onClick={onToggle}
        >
          <i className="fas fa-bars text-sm"></i>
        </button>
      </div>

      {/* Navigation Section */}
      <div className="flex-grow flex flex-col px-3 space-y-1">
        {/* Navigation Links */}
        <nav className="flex-grow overflow-y-auto pr-1 space-y-1" style={{ fontSize: '0.84rem' }}>
          {navigationLinks.map((link) => (
            <a
              key={link.href}
              href={`#${link.href}`}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg ${
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
              <i className={`${link.icon} w-4 text-center ${activeLink === link.href ? '' : 'text-gray-500'}`}></i>
              <span className="sidebar-text">{link.text}</span>
            </a>
          ))}

          <hr className="border-gray-700/30 my-3 sidebar-text" />

          {adminLinks.map((link) => (
            <a
              key={link.href}
              href={`#${link.href}`}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg ${
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
              <i className={`${link.icon} w-4 text-center ${activeLink === link.href ? '' : 'text-gray-500'}`}></i>
              <span className="sidebar-text">{link.text}</span>
            </a>
          ))}
        </nav>

        {/* User Profile & Logout */}
        <div className="mt-auto pt-3 border-t border-gray-700/30">
          <a 
            href="#profile" 
            className="sidebar-link flex items-center space-x-3 px-3 py-2 text-gray-300 rounded-lg" 
            title="Profile"
            onClick={(e) => {
              e.preventDefault()
              onLinkClick('profile')
            }}
          >
            <div className="relative">
              <Image 
                src="https://res.cloudinary.com/du6zyqqyw/image/upload/f_auto,q_auto,w_32/v1740560606/img/2024-2025/team/rakshaksood.jpg" 
                alt="User Avatar" 
                width={28}
                height={28}
                className="w-7 h-7 rounded-full"
              />
              <span className="avatar-status-dot-sidebar bg-green-500"></span>
            </div>
            <div className="flex flex-col text-[0.7rem] sidebar-text">
              <span className="font-medium text-gray-200">Prof. Rakshak S.</span>
              <span className="text-gray-500">Admin</span>
            </div>
          </a>
          <button 
            className="w-full flex items-center space-x-3 px-3 py-2.5 text-xs text-gray-400 hover:bg-red-900/30 hover:text-red-300 rounded-lg mt-2 transition-all duration-200" 
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