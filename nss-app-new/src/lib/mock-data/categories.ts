import type { EventCategory } from '@/types'

export const mockCategories: EventCategory[] = [
  {
    id: 1,
    categoryName: 'Area Activity',
    description: 'Local community service activities',
    colorHex: '#3b82f6',
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 2,
    categoryName: 'College Activity',
    description: 'Activities within the college campus',
    colorHex: '#a855f7',
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 3,
    categoryName: 'NSS Camp',
    description: 'Annual NSS special camps',
    colorHex: '#f97316',
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 4,
    categoryName: 'Workshop',
    description: 'Skill development workshops',
    colorHex: '#6366f1',
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 5,
    categoryName: 'Blood Donation',
    description: 'Blood donation drives',
    colorHex: '#ef4444',
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 6,
    categoryName: 'Tree Plantation',
    description: 'Environmental activities',
    colorHex: '#22c55e',
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
]
