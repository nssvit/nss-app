import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Users,
  Clock,
  CheckCircle,
  BarChart3,
  UserCircle,
  Settings,
  Shield,
  Tag,
  UserCog,
  ScrollText,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  roles?: string[]
  section: 'main' | 'management' | 'admin'
}

export const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    section: 'main',
  },
  {
    label: 'Events',
    href: '/events',
    icon: Calendar,
    section: 'main',
  },
  {
    label: 'Event Registration',
    href: '/event-registration',
    icon: ClipboardList,
    section: 'main',
  },
  {
    label: 'Volunteers',
    href: '/volunteers',
    icon: Users,
    section: 'admin',
    roles: ['admin'],
  },
  {
    label: 'Attendance',
    href: '/attendance',
    icon: Clock,
    section: 'management',
    roles: ['admin', 'head'],
  },
  {
    label: 'Mark Attendance',
    href: '/attendance-manager',
    icon: CheckCircle,
    section: 'management',
    roles: ['admin', 'head'],
  },
  {
    label: 'Hours Approval',
    href: '/hours-approval',
    icon: CheckCircle,
    section: 'management',
    roles: ['admin', 'head'],
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: BarChart3,
    section: 'management',
    roles: ['admin', 'head'],
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: UserCircle,
    section: 'main',
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    section: 'main',
  },
  {
    label: 'Role Management',
    href: '/role-management',
    icon: Shield,
    section: 'admin',
    roles: ['admin'],
  },
  {
    label: 'Categories',
    href: '/categories',
    icon: Tag,
    section: 'admin',
    roles: ['admin'],
  },
  {
    label: 'User Management',
    href: '/user-management',
    icon: UserCog,
    section: 'admin',
    roles: ['admin'],
  },
  {
    label: 'Activity Logs',
    href: '/activity-logs',
    icon: ScrollText,
    section: 'admin',
    roles: ['admin'],
  },
]

export function getNavItemsBySection(section: NavItem['section']) {
  return navItems.filter((item) => item.section === section)
}

export function getFilteredNavItems(userRoles: string[]) {
  return navItems.filter(
    (item) => !item.roles || item.roles.some((role) => userRoles.includes(role))
  )
}
