'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Users, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { EVENT_STATUS, EVENT_STATUS_DISPLAY } from '@/lib/constants'
import { useVolunteers } from '@/hooks/use-volunteers'
import { useAuth } from '@/contexts/auth-context'
import type { EventCategory } from '@/types'
import { createEvent } from '@/app/actions/events'

const schema = z.object({
  eventName: z.string().min(1, 'Event name is required').max(100),
  description: z.string().max(500).optional(),
  startDate: z.string().min(1, 'Start date/time is required'),
  endDate: z.string().min(1, 'End date/time is required'),
  location: z.string().min(1, 'Location is required').max(200),
  maxParticipants: z
    .string()
    .min(1, 'Required')
    .refine((v) => Number(v) >= 1, { message: 'Must be at least 1' }),
  declaredHours: z
    .string()
    .min(1, 'Required')
    .refine((v) => Number(v) >= 1 && Number(v) <= 240, { message: 'Must be between 1 and 240' }),
  categoryId: z.string().min(1, 'Category is required'),
  eventStatus: z.string().min(1, 'Status is required'),
})

type FormValues = z.infer<typeof schema>

function TextField({
  control,
  name,
  label,
  placeholder,
  type = 'text',
  ...rest
}: {
  control: ReturnType<typeof useForm<FormValues>>['control']
  name: keyof FormValues
  label: string
  placeholder?: string
  type?: string
  min?: number
  max?: number
  step?: number
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {type === 'textarea' ? (
              <Textarea placeholder={placeholder} {...field} value={field.value as string} />
            ) : (
              <Input
                type={type}
                placeholder={placeholder}
                min={rest.min}
                max={rest.max}
                step={rest.step}
                {...field}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function SelectField({
  control,
  name,
  label,
  placeholder,
  options,
}: {
  control: ReturnType<typeof useForm<FormValues>>['control']
  name: keyof FormValues
  label: string
  placeholder: string
  options: { value: string; label: string }[]
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value as string}>
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

interface EventFormModalProps {
  categories: EventCategory[]
  onSuccess?: () => void
}

export function EventFormModal({ categories, onSuccess }: EventFormModalProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([])
  const [volunteerSearch, setVolunteerSearch] = useState('')
  const [showVolunteerPicker, setShowVolunteerPicker] = useState(false)

  const { hasAnyRole } = useAuth()
  const canPickVolunteers = hasAnyRole(['admin', 'head'])
  const { volunteers } = useVolunteers()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      eventName: '',
      description: '',
      startDate: '',
      endDate: '',
      location: '',
      maxParticipants: '50',
      declaredHours: '4',
      categoryId: '',
      eventStatus: EVENT_STATUS.PLANNED,
    },
  })

  const categoryOptions = categories.map((c) => ({ value: c.id.toString(), label: c.categoryName }))
  const statusOptions = Object.values(EVENT_STATUS).map((s) => ({
    value: s,
    label: EVENT_STATUS_DISPLAY[s],
  }))

  const filteredVolunteers = volunteers.filter((v) => {
    if (!volunteerSearch) return true
    const q = volunteerSearch.toLowerCase()
    return (
      v.firstName.toLowerCase().includes(q) ||
      v.lastName.toLowerCase().includes(q) ||
      v.rollNumber.toLowerCase().includes(q)
    )
  })

  function toggleVolunteer(id: string) {
    setSelectedVolunteers((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    )
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      await createEvent({
        eventName: values.eventName,
        description: values.description,
        startDate: values.startDate,
        endDate: values.endDate,
        declaredHours: Number(values.declaredHours),
        categoryId: Number(values.categoryId),
        maxParticipants: Number(values.maxParticipants),
        eventStatus: values.eventStatus,
        location: values.location,
      })
      form.reset()
      setSelectedVolunteers([])
      setVolunteerSearch('')
      setShowVolunteerPicker(false)
      setOpen(false)
      onSuccess?.()
    } catch (err) {
      console.error('Failed to create event:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Create Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <TextField
              control={form.control}
              name="eventName"
              label="Event Name"
              placeholder="Enter event name"
            />
            <TextField
              control={form.control}
              name="description"
              label="Description"
              placeholder="Describe the event..."
              type="textarea"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                control={form.control}
                name="startDate"
                label="Start Date & Time"
                type="datetime-local"
              />
              <TextField
                control={form.control}
                name="endDate"
                label="End Date & Time"
                type="datetime-local"
              />
            </div>
            <TextField
              control={form.control}
              name="location"
              label="Location"
              placeholder="Event location"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                control={form.control}
                name="maxParticipants"
                label="Max Participants"
                type="number"
                min={1}
              />
              <TextField
                control={form.control}
                name="declaredHours"
                label="Declared Hours"
                type="number"
                min={1}
                max={240}
                step={1}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                control={form.control}
                name="categoryId"
                label="Category"
                placeholder="Select category"
                options={categoryOptions}
              />
              <SelectField
                control={form.control}
                name="eventStatus"
                label="Status"
                placeholder="Select status"
                options={statusOptions}
              />
            </div>

            {canPickVolunteers && (
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setShowVolunteerPicker(!showVolunteerPicker)}
                >
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Pre-select Volunteers
                    {selectedVolunteers.length > 0 && (
                      <Badge variant="secondary">{selectedVolunteers.length} selected</Badge>
                    )}
                  </span>
                  {showVolunteerPicker ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                {showVolunteerPicker && (
                  <div className="space-y-3 rounded-md border p-3">
                    <Input
                      placeholder="Search volunteers..."
                      value={volunteerSearch}
                      onChange={(e) => setVolunteerSearch(e.target.value)}
                      className="h-8"
                    />
                    <div className="max-h-48 space-y-1 overflow-y-auto">
                      {filteredVolunteers.length === 0 ? (
                        <p className="text-muted-foreground py-3 text-center text-sm">
                          No volunteers found
                        </p>
                      ) : (
                        filteredVolunteers.map((v) => (
                          <label
                            key={v.id}
                            className="hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm"
                          >
                            <Checkbox
                              checked={selectedVolunteers.includes(v.id)}
                              onCheckedChange={() => toggleVolunteer(v.id)}
                            />
                            <span>
                              {v.firstName} {v.lastName}
                            </span>
                            <span className="text-muted-foreground ml-auto text-xs">
                              {v.rollNumber}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button type="submit" className="mt-2 w-full" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Event'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
