'use server'

import { db } from '@/db'
import { eventCategories } from '@/db/schema'
import { createClient } from '@/utils/supabase/server'
import { eq } from 'drizzle-orm'

/**
 * Auth helper - ensures user is authenticated
 */
async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized: Please sign in')
  }

  return user
}

/**
 * Get all active event categories
 */
export async function getCategories() {
  await requireAuth()

  return db.query.eventCategories.findMany({
    where: eq(eventCategories.isActive, true),
    orderBy: (categories, { asc }) => [asc(categories.categoryName)],
  })
}

/**
 * Get a category by ID
 */
export async function getCategoryById(categoryId: number) {
  await requireAuth()

  return db.query.eventCategories.findFirst({
    where: eq(eventCategories.id, categoryId),
  })
}

/**
 * Get category by code
 */
export async function getCategoryByCode(code: string) {
  await requireAuth()

  return db.query.eventCategories.findFirst({
    where: eq(eventCategories.code, code),
  })
}

/**
 * Get all categories (including inactive) with stats
 */
export async function getAllCategories() {
  await requireAuth()

  return db.query.eventCategories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.categoryName)],
  })
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
  await requireAuth()

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
  await requireAuth()

  const [result] = await db
    .update(eventCategories)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(eventCategories.id, categoryId))
    .returning()

  return result
}

/**
 * Deactivate a category
 */
export async function deactivateCategory(categoryId: number) {
  await requireAuth()

  const [result] = await db
    .update(eventCategories)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(eventCategories.id, categoryId))
    .returning()

  return result
}

/**
 * Reactivate a category
 */
export async function reactivateCategory(categoryId: number) {
  await requireAuth()

  const [result] = await db
    .update(eventCategories)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(eventCategories.id, categoryId))
    .returning()

  return result
}

/**
 * Delete a category (hard delete)
 */
export async function deleteCategory(categoryId: number) {
  await requireAuth()

  const [result] = await db
    .delete(eventCategories)
    .where(eq(eventCategories.id, categoryId))
    .returning()

  return result
}
