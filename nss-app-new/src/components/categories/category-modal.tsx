'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { EventCategory } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const categorySchema = z.object({
  categoryName: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color'),
  isActive: z.boolean(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

interface CategoryModalProps {
  category?: EventCategory | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CategoryModal({ category, open, onOpenChange }: CategoryModalProps) {
  const isEditing = !!category

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      categoryName: '',
      description: '',
      colorHex: '#3b82f6',
      isActive: true,
    },
  })

  useEffect(() => {
    if (category) {
      form.reset({
        categoryName: category.categoryName,
        description: category.description ?? '',
        colorHex: category.colorHex,
        isActive: category.isActive,
      })
    } else {
      form.reset({
        categoryName: '',
        description: '',
        colorHex: '#3b82f6',
        isActive: true,
      })
    }
  }, [category, form])

  function onSubmit(values: CategoryFormValues) {
    console.log(isEditing ? 'Updating category:' : 'Creating category:', values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Category' : 'Create Category'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details for this event category.'
              : 'Fill in the details to create a new event category.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="categoryName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Blood Donation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe this category..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="colorHex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <div className="flex items-center gap-3">
                    <FormControl>
                      <Input type="color" className="h-9 w-16 cursor-pointer p-1" {...field} />
                    </FormControl>
                    <span className="text-muted-foreground text-sm">{field.value}</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="size-4 rounded border"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Active</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{isEditing ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
