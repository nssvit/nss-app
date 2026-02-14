'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import type { EventCategory } from '@/types'

const schema = z.object({
  eventName: z.string().min(1, 'Event name is required').max(100),
  description: z.string().max(500).optional(),
  eventDate: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  location: z.string().min(1, 'Location is required').max(200),
  maxParticipants: z.coerce.number().min(1, 'Must be at least 1'),
  hoursCredits: z.coerce.number().min(0.5, 'Must be at least 0.5'),
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
}

export function EventFormModal({ categories }: EventFormModalProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      eventName: '',
      description: '',
      eventDate: '',
      startTime: '',
      endTime: '',
      location: '',
      maxParticipants: 50,
      hoursCredits: 4,
      categoryId: '',
      eventStatus: EVENT_STATUS.PLANNED,
    },
  })

  const categoryOptions = categories.map((c) => ({ value: c.id.toString(), label: c.categoryName }))
  const statusOptions = Object.values(EVENT_STATUS).map((s) => ({
    value: s,
    label: EVENT_STATUS_DISPLAY[s],
  }))

  function onSubmit(values: FormValues) {
    console.log('Event form submitted:', values)
    form.reset()
  }

  return (
    <Dialog>
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <TextField control={form.control} name="eventDate" label="Date" type="date" />
              <TextField control={form.control} name="startTime" label="Start Time" type="time" />
              <TextField control={form.control} name="endTime" label="End Time" type="time" />
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
                name="hoursCredits"
                label="Hours Credits"
                type="number"
                min={0.5}
                step={0.5}
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
            <Button type="submit" className="mt-2 w-full">
              Create Event
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
