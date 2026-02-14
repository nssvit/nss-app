'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { eventCategories } from '@/db/schema'
import { getAuthUser } from '@/lib/auth-cache'

/**
 * Get all active event categories
 */
export async function getCategories() {
  await getAuthUser()

  const rows = await db.query.eventCategories.findMany({
    where: eq(eventCategories.isActive, true),
    orderBy: (categories, { asc }) => [asc(categories.categoryName)],
  })
  return rows.map((r) => ({
    ...r,
    colorHex: r.colorHex ?? '#6366F1',
    isActive: r.isActive ?? true,
  }))
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
  await getAuthUser()

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
  await getAuthUser()

  const [result] = await db
    .update(eventCategories)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(eventCategories.id, categoryId))
    .returning()

  revalidatePath('/categories')
  revalidatePath('/events')
  return result
}

/**
 * Deactivate a category
 */
export async function deactivateCategory(categoryId: number) {
  await getAuthUser()

  const [result] = await db
    .update(eventCategories)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(eventCategories.id, categoryId))
    .returning()

  revalidatePath('/categories')
  revalidatePath('/events')
  return result
}

/**
 * Reactivate a category
 */
export async function reactivateCategory(categoryId: number) {
  await getAuthUser()

  const [result] = await db
    .update(eventCategories)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(eventCategories.id, categoryId))
    .returning()

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
