'use client'

/**
 * Categories Hook
 *
 * Fetches and manages event categories using Server Actions (Drizzle ORM)
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getAllCategories as fetchAllCategoriesAction,
  createCategory as createCategoryAction,
  updateCategory as updateCategoryAction,
  deactivateCategory as deactivateCategoryAction,
  reactivateCategory as reactivateCategoryAction,
  deleteCategory as deleteCategoryAction,
} from '@/app/actions/categories'
import type { EventCategory } from '@/db/schema'

export type Category = EventCategory

export interface CategoryWithStats extends Category {
  eventCount?: number
  // Aliases for snake_case access
  category_name?: string
  is_active?: boolean
  event_count?: number
  color_hex?: string
}

export interface UseCategoriesReturn {
  categories: CategoryWithStats[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  fetchCategories: () => Promise<void>
  getActiveCategories: () => CategoryWithStats[]
  getCategoryById: (id: number) => CategoryWithStats | undefined
  createCategory: (data: { categoryName: string; code?: string; description?: string; colorHex?: string }) => Promise<{ data?: CategoryWithStats; error: string | null }>
  updateCategory: (categoryId: number, data: { categoryName?: string; code?: string; description?: string; colorHex?: string }) => Promise<{ data?: CategoryWithStats; error: string | null }>
  deactivateCategory: (categoryId: number) => Promise<{ error: string | null }>
  reactivateCategory: (categoryId: number) => Promise<{ error: string | null }>
  deleteCategory: (categoryId: number) => Promise<{ error: string | null }>
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<CategoryWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await fetchAllCategoriesAction()
      // Transform to include both camelCase and snake_case properties
      const transformed = (data || []).map((cat: any) => ({
        ...cat,
        // snake_case aliases
        category_name: cat.categoryName,
        is_active: cat.isActive,
        event_count: cat.eventCount || 0,
        color_hex: cat.colorHex,
      }))
      setCategories(transformed)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch categories'
      console.error('[useCategories] Error:', message)
      setError(message)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  const getActiveCategories = useCallback(() => {
    return categories.filter((cat) => cat.isActive ?? cat.is_active)
  }, [categories])

  const getCategoryById = useCallback(
    (id: number) => categories.find((cat) => cat.id === id),
    [categories]
  )

  const handleCreateCategory = useCallback(
    async (data: { categoryName: string; code?: string; description?: string; colorHex?: string }) => {
      try {
        const result = await createCategoryAction(data)
        await fetchCategories()
        return { data: result as CategoryWithStats, error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to create category' }
      }
    },
    [fetchCategories]
  )

  const handleUpdateCategory = useCallback(
    async (categoryId: number, data: { categoryName?: string; code?: string; description?: string; colorHex?: string }) => {
      try {
        const result = await updateCategoryAction(categoryId, data)
        await fetchCategories()
        return { data: result as CategoryWithStats, error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to update category' }
      }
    },
    [fetchCategories]
  )

  const handleDeactivateCategory = useCallback(
    async (categoryId: number) => {
      try {
        await deactivateCategoryAction(categoryId)
        await fetchCategories()
        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to deactivate category' }
      }
    },
    [fetchCategories]
  )

  const handleReactivateCategory = useCallback(
    async (categoryId: number) => {
      try {
        await reactivateCategoryAction(categoryId)
        await fetchCategories()
        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to reactivate category' }
      }
    },
    [fetchCategories]
  )

  const handleDeleteCategory = useCallback(
    async (categoryId: number) => {
      try {
        await deleteCategoryAction(categoryId)
        await fetchCategories()
        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to delete category' }
      }
    },
    [fetchCategories]
  )

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
    fetchCategories,
    getActiveCategories,
    getCategoryById,
    createCategory: handleCreateCategory,
    updateCategory: handleUpdateCategory,
    deactivateCategory: handleDeactivateCategory,
    reactivateCategory: handleReactivateCategory,
    deleteCategory: handleDeleteCategory,
  }
}
