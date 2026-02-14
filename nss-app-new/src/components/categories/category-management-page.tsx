'use client'

import { useState } from 'react'
import type { EventCategory } from '@/types'
import { useCategories } from '@/hooks/use-categories'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/page-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { CategoryModal } from './category-modal'
import { deleteCategory } from '@/app/actions/categories'

export function CategoryManagementPage() {
  const { categories, loading, refresh } = useCategories()
  const [editingCategory, setEditingCategory] = useState<EventCategory | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  function handleCreate() {
    setEditingCategory(null)
    setModalOpen(true)
  }

  function handleEdit(category: EventCategory) {
    setEditingCategory(category)
    setModalOpen(true)
  }

  async function handleDelete(category: EventCategory) {
    if (!confirm(`Delete category "${category.categoryName}"?`)) return
    try {
      await deleteCategory(category.id)
      refresh()
    } catch (err) {
      console.error('Failed to delete category:', err)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Manage event categories and their settings."
        actions={
          <Button onClick={handleCreate}>
            <Plus className="size-4" />
            Add Category
          </Button>
        }
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Color</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell>
                <div
                  className="size-6 rounded-full border"
                  style={{ backgroundColor: category.colorHex }}
                />
              </TableCell>
              <TableCell className="font-medium">{category.categoryName}</TableCell>
              <TableCell className="text-muted-foreground">{category.description ?? '-'}</TableCell>
              <TableCell>
                <Badge
                  className={cn(
                    category.isActive
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  )}
                  variant="secondary"
                >
                  {category.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(category)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(category)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <CategoryModal
        category={editingCategory}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={refresh}
      />
    </div>
  )
}
