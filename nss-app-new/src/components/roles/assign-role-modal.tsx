'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { VolunteerWithStats, RoleDefinition } from '@/types'
import { getVolunteers } from '@/app/actions/volunteers'
import { getRoles, assignRole } from '@/app/actions/roles'
import { ROLE_DISPLAY_NAMES, type Role } from '@/lib/constants'
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
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const assignRoleSchema = z.object({
  volunteerId: z.string().min(1, 'Please select a volunteer'),
  roleDefinitionId: z.string().min(1, 'Please select a role'),
})

type AssignRoleFormValues = z.infer<typeof assignRoleSchema>

interface AssignRoleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AssignRoleModal({ open, onOpenChange, onSuccess }: AssignRoleModalProps) {
  const [volunteers, setVolunteers] = useState<VolunteerWithStats[]>([])
  const [roleDefinitions, setRoleDefinitions] = useState<RoleDefinition[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<AssignRoleFormValues>({
    resolver: zodResolver(assignRoleSchema),
    defaultValues: {
      volunteerId: '',
      roleDefinitionId: '',
    },
  })

  useEffect(() => {
    if (open) {
      async function loadData() {
        setDataLoading(true)
        try {
          const [v, rd] = await Promise.all([getVolunteers(), getRoles()])
          setVolunteers(v)
          setRoleDefinitions(rd)
        } catch (err) {
          console.error('Failed to load data:', err)
        } finally {
          setDataLoading(false)
        }
      }
      loadData()
      form.reset({ volunteerId: '', roleDefinitionId: '' })
    }
  }, [open, form])

  async function onSubmit(values: AssignRoleFormValues) {
    setSubmitting(true)
    try {
      await assignRole(values.volunteerId, values.roleDefinitionId)
      toast.success('Role assigned successfully')
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      toast.error('Failed to assign role')
      console.error('Failed to assign role:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Role</DialogTitle>
          <DialogDescription>
            Assign a role to a volunteer. Select the volunteer and the role to assign.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="volunteerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Volunteer</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={dataLoading}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a volunteer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {volunteers.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.firstName} {v.lastName} ({v.rollNumber})
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={dataLoading || submitting}>
                {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                {submitting ? 'Assigning...' : 'Assign Role'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
