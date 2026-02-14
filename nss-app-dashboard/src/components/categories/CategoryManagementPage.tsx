'use client'

import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui'
import { useCategories, Category, CategoryWithStats } from '@/hooks/useCategories'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { useToast } from '@/hooks/useToast'

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<Category>) => Promise<void>
  initialData?: CategoryWithStats
  mode: 'create' | 'edit'
}

function CategoryModal({ isOpen, onClose, onSubmit, initialData, mode }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    category_name: '',
    code: '',
    description: '',
    is_active: true,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        category_name: initialData.category_name || '',
        code: initialData.code || '',
        description: initialData.description || '',
        is_active: initialData.is_active ?? true,
      })
    } else {
      setFormData({
        category_name: '',
        code: '',
        description: '',
        is_active: true,
      })
    }
  }, [initialData, mode, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit({
        ...formData,
        code: formData.code || formData.category_name.toLowerCase().replace(/\s+/g, '-'),
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  // Auto-generate code from category_name
  const handleCategoryNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      category_name: value,
      code:
        mode === 'create'
          ? value
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '')
          : prev.code,
    }))
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl border border-gray-700/50 bg-gray-900/95 p-6 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-100">
            {mode === 'create' ? 'Create Category' : 'Edit Category'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-2xl leading-none text-gray-500 hover:text-white"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Category Name</label>
            <input
              type="text"
              required
              className="input-dark w-full rounded-lg px-4 py-3 text-sm"
              placeholder="e.g., Community Service"
              value={formData.category_name}
              onChange={(e) => handleCategoryNameChange(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Code (Internal)</label>
            <input
              type="text"
              required
              className="input-dark w-full rounded-lg px-4 py-3 text-sm"
              placeholder="e.g., community-service"
              value={formData.code}
              onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
              disabled={mode === 'edit'}
            />
            <p className="mt-1 text-xs text-gray-500">
              Lowercase with hyphens, auto-generated from name
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Description</label>
            <textarea
              className="input-dark w-full resize-none rounded-lg px-4 py-3 text-sm"
              rows={3}
              placeholder="Describe this category..."
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
              className="h-4 w-4 rounded"
            />
            <label htmlFor="is_active" className="text-sm text-gray-300">
              Active
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="button-glass-secondary hover-lift rounded-lg px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="button-glass-primary hover-lift rounded-lg px-4 py-2 text-sm disabled:opacity-50"
            >
              {submitting ? 'Saving...' : mode === 'create' ? 'Create Category' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function CategoryManagementPage() {
  const layout = useResponsiveLayout()
  const { success: showSuccess, error: showError } = useToast()
  const {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deactivateCategory,
    reactivateCategory,
    deleteCategory,
  } = useCategories()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('')
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryWithStats | undefined>(undefined)

  // Stats calculations
  const stats = {
    totalCategories: categories.length,
    activeCategories: categories.filter((c) => c.is_active).length,
    inactiveCategories: categories.filter((c) => !c.is_active).length,
    totalEvents: categories.reduce((sum, c) => sum + (c.event_count || 0), 0),
  }

  // Filter categories
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      cat.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      !statusFilter ||
      (statusFilter === 'active' && cat.is_active) ||
      (statusFilter === 'inactive' && !cat.is_active)

    return matchesSearch && matchesStatus
  })

  const handleCreateCategory = async (data: Partial<Category>) => {
    // Convert null to undefined for optional fields
    const sanitizedData = {
      categoryName: data.categoryName || '',
      code: data.code || undefined,
      description: data.description ?? undefined,
      colorHex: data.colorHex ?? undefined,
    }
    const result = await createCategory(sanitizedData)
    if (result.error) {
      showError(result.error)
    } else {
      showSuccess('Category created successfully')
    }
  }

  const handleUpdateCategory = async (data: Partial<Category>) => {
    if (!editingCategory) return
    // Convert null to undefined for optional fields
    const sanitizedData = {
      categoryName: data.categoryName,
      code: data.code || undefined,
      description: data.description ?? undefined,
      colorHex: data.colorHex ?? undefined,
    }
    const result = await updateCategory(editingCategory.id, sanitizedData)
    if (result.error) {
      showError(result.error)
    } else {
      showSuccess('Category updated successfully')
    }
  }

  const handleToggleActive = async (category: CategoryWithStats) => {
    if (category.is_active) {
      const result = await deactivateCategory(category.id)
      if (result.error) {
        showError(result.error)
      } else {
        showSuccess('Category deactivated')
      }
    } else {
      const result = await reactivateCategory(category.id)
      if (result.error) {
        showError(result.error)
      } else {
        showSuccess('Category reactivated')
      }
    }
  }

  const handleDeleteCategory = async (category: CategoryWithStats) => {
    if ((category.event_count || 0) > 0) {
      showError('Cannot delete category with associated events. Deactivate it instead.')
      return
    }

    if (
      !confirm(
        `Are you sure you want to permanently delete "${category.category_name}"? This cannot be undone.`
      )
    ) {
      return
    }

    const result = await deleteCategory(category.id)
    if (result.error) {
      showError(result.error)
    } else {
      showSuccess('Category deleted')
    }
  }

  const statsDisplay = [
    { label: 'Total Categories', value: stats.totalCategories.toString(), color: 'text-blue-400' },
    { label: 'Active', value: stats.activeCategories.toString(), color: 'text-green-400' },
    { label: 'Inactive', value: stats.inactiveCategories.toString(), color: 'text-yellow-400' },
    { label: 'Total Events', value: stats.totalEvents.toString(), color: 'text-purple-400' },
  ]

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <i className="fas fa-exclamation-circle mb-4 text-4xl text-red-400"></i>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={fetchCategories}
            className="button-glass-primary mt-4 rounded-lg px-4 py-2"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`main-content-bg mobile-scroll safe-area-bottom flex-1 overflow-x-hidden overflow-y-auto ${layout.getContentPadding()}`}
    >
      {/* Stats Row */}
      <div className={`grid ${layout.isMobile ? 'grid-cols-2' : 'grid-cols-4'} mb-6 gap-4`}>
        {loading ? (
          <>
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </>
        ) : (
          statsDisplay.map((stat, index) => (
            <div key={index} className="card-glass rounded-xl p-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <input
            type="text"
            placeholder="Search categories..."
            className="input-dark w-full rounded-lg px-3 py-2 pl-9 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="fas fa-search absolute top-1/2 left-3 -translate-y-1/2 transform text-sm text-gray-500"></i>
        </div>

        <select
          className="input-dark rounded-lg px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as '' | 'active' | 'inactive')}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button
          onClick={() => {
            setSearchTerm('')
            setStatusFilter('')
          }}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-300"
        >
          Clear
        </button>
      </div>

      {/* Action Bar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setEditingCategory(undefined)
              setShowModal(true)
            }}
            className="button-glass-primary hover-lift flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium"
          >
            <i className="fas fa-plus fa-sm"></i>
            <span>Create Category</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchCategories}
            className="action-button rounded-lg p-2 text-gray-400 hover:text-gray-200"
          >
            <i className="fas fa-sync"></i>
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div
        className={`grid ${layout.isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'} gap-4`}
      >
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
        ) : filteredCategories.length === 0 ? (
          <div className="card-glass col-span-full rounded-xl p-8 text-center text-gray-400">
            <i className="fas fa-folder-open mb-3 text-4xl"></i>
            <p>No categories found</p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div
              key={category.id}
              className={`card-glass rounded-xl p-4 transition-colors hover:bg-gray-800/30 ${
                !category.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-900/30">
                    <i className="fas fa-tag text-indigo-400"></i>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-200">{category.category_name}</h3>
                    <p className="text-xs text-gray-500">{category.code}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    category.is_active
                      ? 'bg-green-900/30 text-green-400'
                      : 'bg-red-900/30 text-red-400'
                  }`}
                >
                  {category.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="mb-3 line-clamp-2 text-sm text-gray-400">
                {category.description || 'No description'}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>
                    <i className="fas fa-calendar-alt mr-1"></i>
                    {category.event_count || 0} events
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setEditingCategory(category)
                      setShowModal(true)
                    }}
                    className="rounded p-1 text-gray-400 hover:text-blue-400"
                    title="Edit category"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    onClick={() => handleToggleActive(category)}
                    className={`rounded p-1 ${
                      category.is_active
                        ? 'text-gray-400 hover:text-yellow-400'
                        : 'text-gray-400 hover:text-green-400'
                    }`}
                    title={category.is_active ? 'Deactivate' : 'Reactivate'}
                  >
                    <i className={`fas fa-${category.is_active ? 'ban' : 'check-circle'}`}></i>
                  </button>
                  {(category.event_count || 0) === 0 && (
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      className="rounded p-1 text-gray-400 hover:text-red-400"
                      title="Delete category"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <CategoryModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingCategory(undefined)
        }}
        onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
        initialData={editingCategory}
        mode={editingCategory ? 'edit' : 'create'}
      />
    </div>
  )
}
