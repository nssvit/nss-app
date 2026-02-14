'use client'

import { useEffect } from 'react'
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
  hierarchyLevel: z.coerce
    .number()
    .int('Must be a whole number')
    .min(0, 'Hierarchy level must be 0 or greater')
    .max(100, 'Hierarchy level is too high'),
  isActive: z.boolean(),
})

type RoleDefinitionFormValues = z.infer<typeof roleDefinitionSchema>

interface RoleDefinitionModalProps {
  role?: RoleDefinition | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RoleDefinitionModal({ role, open, onOpenChange }: RoleDefinitionModalProps) {
  const isEditing = !!role

  const form = useForm<RoleDefinitionFormValues>({
    resolver: zodResolver(roleDefinitionSchema),
    defaultValues: {
      roleName: '',
      description: '',
      hierarchyLevel: 0,
      isActive: true,
    },
  })

  useEffect(() => {
    if (role) {
      form.reset({
        roleName: role.roleName,
        description: role.description ?? '',
        hierarchyLevel: role.hierarchyLevel,
        isActive: role.isActive,
      })
    } else {
      form.reset({
        roleName: '',
        description: '',
        hierarchyLevel: 0,
        isActive: true,
      })
    }
  }, [role, form])

  function onSubmit(values: RoleDefinitionFormValues) {
    console.log(isEditing ? 'Updating role:' : 'Creating role:', values)
    onOpenChange(false)
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
                    <Input placeholder="e.g. event_lead" {...field} />
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
              <Button type="submit">{isEditing ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
