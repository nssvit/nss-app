'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Tables } from '@/types/database.types'

export type Category = Tables<'event_categories'>

export interface CategoryWithStats extends Category {
  event_count?: number
}

export function useCategories() {
  const [categories, setCategories] = useState<CategoryWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all categories with event counts
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('event_categories')
        .select('*')
        .order('category_name', { ascending: true })

      if (categoriesError) throw categoriesError

      // Fetch event counts per category
      const { data: eventCounts, error: countsError } = await supabase
        .from('events')
        .select('category_id')

      if (countsError) {
        console.warn('Could not fetch event counts:', countsError)
      }

      // Calculate counts per category
      const countMap: Record<string, number> = {}
      if (eventCounts) {
        eventCounts.forEach((event) => {
          if (event.category_id) {
            countMap[event.category_id] = (countMap[event.category_id] || 0) + 1
          }
        })
      }

      // Merge categories with counts
      const categoriesWithStats: CategoryWithStats[] = (categoriesData || []).map((cat) => ({
        ...cat,
        event_count: countMap[cat.id] || 0,
      }))

      setCategories(categoriesWithStats)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories'
      console.error('Error fetching categories:', errorMessage)
      setError(errorMessage)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Get active categories only (for dropdowns)
  const getActiveCategories = useCallback(() => {
    return categories.filter((cat) => cat.is_active)
  }, [categories])

  // Get category by ID
  const getCategoryById = useCallback(
    (id: string) => {
      return categories.find((cat) => cat.id === id)
    },
    [categories]
  )

  // Get category by name
  const getCategoryByName = useCallback(
    (name: string) => {
      return categories.find(
        (cat) => cat.category_name.toLowerCase() === name.toLowerCase()
      )
    },
    [categories]
  )

  // Create a new category
  const createCategory = async (
    categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      // Check for duplicate category_name
      const existing = categories.find(
        (cat) =>
          cat.category_name.toLowerCase() === categoryData.category_name.toLowerCase()
      )
      if (existing) {
        return {
          data: null,
          error: 'A category with this name already exists',
        }
      }

      const { data, error } = await supabase
        .from('event_categories')
        .insert({
          category_name: categoryData.category_name,
          code: categoryData.code || categoryData.category_name.toLowerCase().replace(/\s+/g, '-'),
          description: categoryData.description,
          is_active: categoryData.is_active ?? true,
        })
        .select()
        .single()

      if (error) throw error

      await fetchCategories() // Refresh the list
      return { data, error: null }
    } catch (err) {
      console.error('Error creating category:', err)
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to create category',
      }
    }
  }

  // Update a category
  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      // If updating category_name, check for duplicates
      if (updates.category_name) {
        const existing = categories.find(
          (cat) =>
            cat.id !== id &&
            cat.category_name.toLowerCase() === updates.category_name!.toLowerCase()
        )
        if (existing) {
          return {
            data: null,
            error: 'A category with this name already exists',
          }
        }
        // Normalize category_name
        updates.category_name = updates.category_name.toLowerCase().replace(/\s+/g, '_')
      }

      const { data, error } = await supabase
        .from('event_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await fetchCategories() // Refresh the list
      return { data, error: null }
    } catch (err) {
      console.error('Error updating category:', err)
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to update category',
      }
    }
  }

  // Deactivate a category (soft delete)
  const deactivateCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('event_categories')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      await fetchCategories() // Refresh the list
      return { error: null }
    } catch (err) {
      console.error('Error deactivating category:', err)
      return {
        error: err instanceof Error ? err.message : 'Failed to deactivate category',
      }
    }
  }

  // Reactivate a category
  const reactivateCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('event_categories')
        .update({ is_active: true })
        .eq('id', id)

      if (error) throw error

      await fetchCategories() // Refresh the list
      return { error: null }
    } catch (err) {
      console.error('Error reactivating category:', err)
      return {
        error: err instanceof Error ? err.message : 'Failed to reactivate category',
      }
    }
  }

  // Permanently delete a category (use with caution)
  const deleteCategory = async (id: string) => {
    try {
      // Check if category is used by any events
      const category = categories.find((cat) => cat.id === id)
      if (category && (category.event_count || 0) > 0) {
        return {
          error: 'Cannot delete category that is used by events. Deactivate it instead.',
        }
      }

      const { error } = await supabase.from('event_categories').delete().eq('id', id)

      if (error) throw error

      await fetchCategories() // Refresh the list
      return { error: null }
    } catch (err) {
      console.error('Error deleting category:', err)
      return {
        error: err instanceof Error ? err.message : 'Failed to delete category',
      }
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return {
    // State
    categories,
    loading,
    error,

    // Fetch
    fetchCategories,

    // Query helpers
    getActiveCategories,
    getCategoryById,
    getCategoryByName,

    // Mutations
    createCategory,
    updateCategory,
    deactivateCategory,
    reactivateCategory,
    deleteCategory,
  }
}
