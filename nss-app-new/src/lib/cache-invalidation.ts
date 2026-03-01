/**
 * Cache Invalidation Layer
 *
 * Dual-layer invalidation: busts both Redis (persistent, cross-instance)
 * and Next.js ISR cache (per-instance) on mutations.
 *
 * Each domain function maps to specific Redis keys + Next.js tags/paths.
 */

import { revalidateTag, revalidatePath } from 'next/cache'
import { invalidateKeys, CACHE_KEYS } from './redis'

// --- Domain-specific invalidation ---

/**
 * Invalidate dashboard + report caches.
 * Called by: event, attendance, and hours mutations.
 */
export async function invalidateDashboardCache() {
  // Redis layer
  await invalidateKeys([
    CACHE_KEYS.DASHBOARD_STATS,
    CACHE_KEYS.MONTHLY_TRENDS,
  ])
  // Next.js ISR layer
  revalidateTag('dashboard-stats')
}

/**
 * Invalidate all report aggregate caches.
 * Called by: hours approval, attendance mutations.
 */
export async function invalidateReportsCache() {
  await invalidateKeys([
    CACHE_KEYS.CATEGORY_DISTRIBUTION,
    CACHE_KEYS.TOP_EVENTS,
    CACHE_KEYS.ATTENDANCE_SUMMARY,
    CACHE_KEYS.VOLUNTEER_HOURS,
  ])
}

/**
 * Invalidate category reference data cache.
 * Called by: category create/update/deactivate/reactivate.
 */
export async function invalidateCategoriesCache() {
  await invalidateKeys([
    CACHE_KEYS.CATEGORIES,
    // Category changes also affect report distributions
    CACHE_KEYS.CATEGORY_DISTRIBUTION,
  ])
  revalidateTag('categories')
}

/**
 * Invalidate role definitions cache.
 * Called by: role definition create/update.
 */
export async function invalidateRolesCache() {
  await invalidateKeys([CACHE_KEYS.ROLE_DEFINITIONS])
  revalidateTag('role-definitions')
}

// --- Composite invalidation for common mutation patterns ---

/**
 * Full invalidation for attendance-related mutations.
 * Busts dashboard stats, attendance summary, and report aggregates.
 */
export async function invalidateAttendanceMutation(eventId?: string) {
  await Promise.all([
    invalidateDashboardCache(),
    invalidateKeys([CACHE_KEYS.ATTENDANCE_SUMMARY]),
  ])
  revalidatePath('/attendance')
  if (eventId) revalidatePath(`/events/${eventId}`)
}

/**
 * Full invalidation for hours approval mutations.
 * Busts dashboard stats, volunteer hours, and report aggregates.
 */
export async function invalidateHoursMutation() {
  await Promise.all([
    invalidateDashboardCache(),
    invalidateReportsCache(),
  ])
  revalidatePath('/hours-approval')
  revalidatePath('/reports')
}
