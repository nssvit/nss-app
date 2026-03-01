'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getRoles, updateRoleAssignment } from '@/app/actions/roles'
import { ROLE_DISPLAY_NAMES, type Role } from '@/lib/constants'
import type { RoleDefinition } from '@/types'
import type { getAllRoleAssignments } from '@/app/actions/roles'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

type RoleAssignment = Awaited<ReturnType<typeof getAllRoleAssignments>>[number]

const editSchema = z.object({
  roleDefinitionId: z.string().min(1, 'Please select a role'),
  expiresAt: z.string().optional(),
})

type EditFormValues = z.infer<typeof editSchema>

interface EditRoleAssignmentModalProps {
  assignment: RoleAssignment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditRoleAssignmentModal({
  assignment,
  open,
  onOpenChange,
  onSuccess,
}: EditRoleAssignmentModalProps) {
  const [roleDefinitions, setRoleDefinitions] = useState<RoleDefinition[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      roleDefinitionId: '',
      expiresAt: '',
    },
  })

  useEffect(() => {
    if (open) {
      async function loadRoles() {
        setDataLoading(true)
        try {
          const rd = await getRoles()
          setRoleDefinitions(rd)
        } catch (err) {
          console.error('Failed to load roles:', err)
        } finally {
          setDataLoading(false)
        }
      }
      loadRoles()
    }
  }, [open])

  useEffect(() => {
    if (assignment && open) {
      const expiresStr = assignment.expiresAt
        ? new Date(assignment.expiresAt).toISOString().split('T')[0]
        : ''
      form.reset({
        roleDefinitionId: assignment.roleDefinitionId,
        expiresAt: expiresStr,
      })
    }
  }, [assignment, open, form])

  async function onSubmit(values: EditFormValues) {
    if (!assignment) return
    setSubmitting(true)
    try {
      const updates: { roleDefinitionId?: string; expiresAt?: Date | null } = {}

      if (values.roleDefinitionId !== assignment.roleDefinitionId) {
        updates.roleDefinitionId = values.roleDefinitionId
      }

      const newExpires = values.expiresAt ? new Date(values.expiresAt) : null
      const oldExpires = assignment.expiresAt
        ? new Date(assignment.expiresAt).toISOString().split('T')[0]
        : ''
      if ((values.expiresAt ?? '') !== oldExpires) {
        updates.expiresAt = newExpires
      }

      if (Object.keys(updates).length === 0) {
        toast.info('No changes to save')
        onOpenChange(false)
        return
      }

      await updateRoleAssignment(assignment.id, updates)
      toast.success('Role assignment updated')
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role assignment')
    } finally {
      setSubmitting(false)
    }
  }

  const volunteerName = assignment?.volunteer
    ? `${assignment.volunteer.firstName} ${assignment.volunteer.lastName}`
    : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Role Assignment</DialogTitle>
          <DialogDescription>
            Update the role or expiration for {volunteerName}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="roleDefinitionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={dataLoading}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roleDefinitions.map((rd) => (
                        <SelectItem key={rd.id} value={rd.id}>
                          {ROLE_DISPLAY_NAMES[rd.roleName as Role] ?? rd.roleName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expires At</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={dataLoading || submitting}>
                {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
