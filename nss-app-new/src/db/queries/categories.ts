/**
 * Category Queries
 * Provides event category database operations
 */

import { eq } from 'drizzle-orm'
import { db } from '../index'
import { eventCategories, type NewEventCategory } from '../schema'

/**
 * Get all active categories
 */
export async function getActiveCategories() {
  return await db.query.eventCategories.findMany({
    where: eq(eventCategories.isActive, true),
    orderBy: (cat, { asc }) => [asc(cat.categoryName)],
  })
}

/**
 * Create a new category
 */
export async function createCategory(data: {
  categoryName: string
  code: string
  description?: string | null
  colorHex?: string | null
}) {
  const [result] = await db
    .insert(eventCategories)
    .values({
      categoryName: data.categoryName,
      code: data.code,
      description: data.description,
      colorHex: data.colorHex ?? '#6366F1',
    })
    .returning()

  return result
}

/**
 * Update a category
 */
export async function updateCategory(
  categoryId: number,
  data: Partial<Pick<NewEventCategory, 'categoryName' | 'code' | 'description' | 'colorHex' | 'isActive'>>
) {
  const cleanUpdates = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  )

  const [result] = await db
    .update(eventCategories)
    .set({
      ...cleanUpdates,
      updatedAt: new Date(),
    })
    .where(eq(eventCategories.id, categoryId))
    .returning()

  return result
}

/**
 * Soft delete a category
 */
export async function deleteCategory(categoryId: number) {
  const [result] = await db
    .update(eventCategories)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(eventCategories.id, categoryId))
    .returning()

  return result
}
