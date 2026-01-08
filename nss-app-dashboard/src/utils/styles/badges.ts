/**
 * Utility functions for applying CSS class-based styling
 * Uses design tokens from CSS for consistency
 */

/**
 * Get CSS class for status badges
 * Returns: 'badge badge-{variant}'
 */
export const getStatusBadgeClass = (status: string): string => {
  const statusMap: Record<string, string> = {
    Active: 'badge badge-success',
    Inactive: 'badge badge-error',
    Pending: 'badge badge-warning',
    Completed: 'badge badge-success',
    Ongoing: 'badge badge-warning',
    Upcoming: 'badge badge-info',
    Cancelled: 'badge badge-error',
    Draft: 'badge badge-neutral',
  }

  return statusMap[status] || 'badge badge-neutral'
}

/**
 * Get CSS class for category badges
 * Returns: 'category-badge category-{type}'
 */
export const getCategoryBadgeClass = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'Area Based - 1': 'category-badge category-area',
    'area based - 1': 'category-badge category-area',
    'College Event': 'category-badge category-college',
    'college event': 'category-badge category-college',
    Camp: 'category-badge category-camp',
    camp: 'category-badge category-camp',
    Workshop: 'category-badge category-workshop',
    workshop: 'category-badge category-workshop',
    Seminar: 'category-badge category-seminar',
    seminar: 'category-badge category-seminar',
    Training: 'category-badge category-training',
    training: 'category-badge category-training',
    Competition: 'category-badge category-competition',
    competition: 'category-badge category-competition',
    'Social Service': 'category-badge category-social',
    'social service': 'category-badge category-social',
  }

  const lowerCategory = category.toLowerCase()
  const matchedKey = Object.keys(categoryMap).find(
    (key) => key.toLowerCase() === lowerCategory
  )

  return matchedKey ? categoryMap[matchedKey] : 'category-badge category-default'
}

/**
 * Get stats card variant based on metric type
 */
export const getStatsVariant = (
  metricType: string
): 'primary' | 'success' | 'warning' | 'info' | 'error' | 'purple' | 'orange' => {
  const variantMap: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'error' | 'purple' | 'orange'> = {
    volunteers: 'primary',
    events: 'purple',
    hours: 'success',
    impact: 'success',
    attendance: 'info',
    pending: 'warning',
    completed: 'success',
    cancelled: 'error',
    active: 'success',
  }

  return variantMap[metricType.toLowerCase()] || 'primary'
}

/**
 * Get text color class for impact levels
 */
export const getImpactColorClass = (impact: string): string => {
  const impactMap: Record<string, string> = {
    High: 'text-green-400',
    Medium: 'text-yellow-400',
    Low: 'text-orange-400',
  }

  return impactMap[impact] || 'text-gray-400'
}

/**
 * Get attendance color based on percentage
 */
export const getAttendanceColorClass = (percentage: number): string => {
  if (percentage >= 75) return 'text-green-400'
  if (percentage >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

/**
 * Get button variant for action type
 */
export const getActionButtonVariant = (
  action: 'create' | 'edit' | 'delete' | 'view' | 'cancel' | 'save'
): string => {
  const variantMap: Record<string, string> = {
    create: 'btn btn-md btn-primary',
    save: 'btn btn-md btn-success',
    edit: 'btn btn-md btn-secondary',
    view: 'btn btn-md btn-ghost',
    cancel: 'btn btn-md btn-secondary',
    delete: 'btn btn-md btn-danger',
  }

  return variantMap[action] || 'btn btn-md btn-secondary'
}
