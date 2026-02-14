'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { CurrentUser } from '@/types'
import { updateMyProfile } from '@/app/actions/volunteers'
import { BRANCH_DISPLAY_NAMES, YEAR_DISPLAY_NAMES } from '@/lib/constants'

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNo: z.string().nullable(),
  address: z.string().nullable(),
  birthDate: z.string().nullable(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface ProfileFormProps {
  user: CurrentUser
  onSuccess?: () => void
}

export function ProfileForm({ user, onSuccess }: ProfileFormProps) {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNo: user.phoneNo ?? '',
      address: user.address ?? '',
      birthDate: user.birthDate ?? '',
    },
  })

  async function onSubmit(values: ProfileFormValues) {
    setSubmitting(true)
    try {
      await updateMyProfile({
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNo: values.phoneNo || undefined,
        address: values.address || undefined,
        birthDate: values.birthDate || undefined,
      })
      onSuccess?.()
    } catch (err) {
      console.error('Failed to update profile:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-muted-foreground text-sm font-medium">Personal Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phoneNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birth Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-muted-foreground text-sm font-medium">Academic Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input value={user.email} readOnly disabled />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Roll Number</label>
                  <Input value={user.rollNumber} readOnly disabled />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Branch</label>
                  <Input value={BRANCH_DISPLAY_NAMES[user.branch] ?? user.branch} readOnly disabled />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Year</label>
                  <Input value={YEAR_DISPLAY_NAMES[user.year] ?? user.year} readOnly disabled />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
