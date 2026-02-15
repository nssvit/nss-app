'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { eq, and, count } from 'drizzle-orm'
import { db } from '@/db'
import { eventCategories, events } from '@/db/schema'
import { getAuthUser, requireAdmin } from '@/lib/auth-cache'
import { getCachedCategories } from '@/lib/query-cache'

/**
 * Get all active event categories
 */
export async function getCategories() {
  await getAuthUser()
  return getCachedCategories()
}

/**
 * Get a category by ID
 */
export async function getCategoryById(categoryId: number) {
  await getAuthUser()

  return db.query.eventCategories.findFirst({
    where: eq(eventCategories.id, categoryId),
  })
}

/**
 * Get category by code
 */
export async function getCategoryByCode(code: string) {
  await getAuthUser()

  return db.query.eventCategories.findFirst({
    where: eq(eventCategories.code, code),
  })
}

/**
 * Get all categories (including inactive) with stats
 */
export async function getAllCategories() {
  await getAuthUser()

  const rows = await db.query.eventCategories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.categoryName)],
  })
  return rows.map((r) => ({
    ...r,
    colorHex: r.colorHex ?? '#6366F1',
    isActive: r.isActive ?? true,
  }))
}

/**
 * Create a new category
 */
export async function createCategory(data: {
  categoryName: string
  code?: string
  description?: string
  colorHex?: string
}) {
  await requireAdmin()

  const [result] = await db
    .insert(eventCategories)
    .values({
      categoryName: data.categoryName,
      code: data.code || data.categoryName.toLowerCase().replace(/\s+/g, '-'),
      description: data.description,
      colorHex: data.colorHex || '#6366F1',
      isActive: true,
    })
    .returning()

  revalidateTag('categories')
  revalidatePath('/categories')
  revalidatePath('/events')
  return result
}

/**
 * Update a category
 */
export async function updateCategory(
  categoryId: number,
  data: {
    categoryName?: string
    code?: string
    description?: string
    colorHex?: string
  }
) {
  await requireAdmin()

  const [result] = await db
    .update(eventCategories)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(eventCategories.id, categoryId))
    .returning()

  revalidateTag('categories')
  revalidatePath('/categories')
  revalidatePath('/events')
  return result
}

/**
 * Deactivate a category
 */
export async function deactivateCategory(categoryId: number) {
  await requireAdmin()

  // Prevent deactivating category with active events
  const [activeEvents] = await db
    .select({ count: count() })
    .from(events)
    .where(and(eq(events.categoryId, categoryId), eq(events.isActive, true)))

  if ((activeEvents?.count ?? 0) > 0) {
    throw new Error(
      `Cannot deactivate category: ${activeEvents.count} active event(s) still use this category. Reassign or delete those events first.`
    )
  }

  const [result] = await db
    .update(eventCategories)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(eventCategories.id, categoryId))
    .returning()

  revalidateTag('categories')
  revalidatePath('/categories')
  revalidatePath('/events')
  return result
}

/**
 * Reactivate a category
 */
export async function reactivateCategory(categoryId: number) {
  await requireAdmin()

  const [result] = await db
    .update(eventCategories)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(eventCategories.id, categoryId))
    .returning()

  revalidateTag('categories')
  revalidatePath('/categories')
  revalidatePath('/events')
  return result
}

/**
 * Delete a category (soft-delete via deactivation)
 */
export async function deleteCategory(categoryId: number) {
  return deactivateCategory(categoryId)
}
