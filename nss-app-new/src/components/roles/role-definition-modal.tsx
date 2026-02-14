'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { RoleDefinition } from '@/types'
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

const roleDefinitionSchema = z.object({
  roleName: z.string().min(1, 'Role name is required').max(50, 'Role name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  hierarchyLevel: z
    .string()
    .min(1, 'Hierarchy level is required')
    .refine((v) => Number.isInteger(Number(v)), { message: 'Must be a whole number' })
    .refine((v) => Number(v) >= 0, { message: 'Hierarchy level must be 0 or greater' })
    .refine((v) => Number(v) <= 100, { message: 'Hierarchy level is too high' }),
  isActive: z.boolean(),
})

type RoleDefinitionFormValues = z.infer<typeof roleDefinitionSchema>

interface RoleDefinitionModalProps {
  role?: RoleDefinition | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function RoleDefinitionModal({
  role,
  open,
  onOpenChange,
  onSuccess,
}: RoleDefinitionModalProps) {
  const isEditing = !!role
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<RoleDefinitionFormValues>({
    resolver: zodResolver(roleDefinitionSchema),
    defaultValues: {
      roleName: '',
      description: '',
      hierarchyLevel: '0',
      isActive: true,
    },
  })

  useEffect(() => {
    if (role) {
      form.reset({
        roleName: role.roleName,
        description: role.description ?? '',
        hierarchyLevel: String(role.hierarchyLevel),
        isActive: role.isActive,
      })
    } else {
      form.reset({
        roleName: '',
        description: '',
        hierarchyLevel: '0',
        isActive: true,
      })
    }
  }, [role, form])

  async function onSubmit(values: RoleDefinitionFormValues) {
    setSubmitting(true)
    try {
      // Role definitions are managed via direct DB queries in production
      // For now, log and close - role CRUD server actions can be added later
      const payload = { ...values, hierarchyLevel: Number(values.hierarchyLevel) }
      console.log(isEditing ? 'Updating role:' : 'Creating role:', payload)
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error('Failed to save role:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Role Definition' : 'Create Role Definition'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details for this role definition.'
              : 'Fill in the details to create a new role definition.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="roleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. head" {...field} />
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
                    <Textarea placeholder="Describe this role..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hierarchyLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hierarchy Level</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={100} {...field} />
                  </FormControl>
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
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
