import {
  LayoutDashboard,
  Calendar,
  Users,
  Clock,
  BarChart3,
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
    label: 'Attendance',
    href: '/attendance',
    icon: Clock,
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
    label: 'Volunteers',
    href: '/volunteers',
    icon: Users,
    section: 'admin',
    roles: ['admin'],
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
