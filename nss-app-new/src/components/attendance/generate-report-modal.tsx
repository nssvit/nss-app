'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, FileText } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getErrorMessage } from '@/lib/error-utils'
import type { EventWithStats } from '@/types'
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
import { generateNssReport } from '@/app/actions/reports'

const schema = z.object({
  majorObjective: z
    .string()
    .trim()
    .min(10, 'Give a sentence describing the objective (10+ chars)')
    .max(500),
  scheme: z.string().trim().max(100).optional(),
  organizingUnit: z.string().trim().max(100).optional(),
})

type FormValues = z.infer<typeof schema>

interface GenerateReportModalProps {
  event: EventWithStats | null
  presentCount: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

function triggerDownload(filename: string, base64: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function defaultSchemeFor(event: EventWithStats | null): string {
  const name = event?.categoryName?.toLowerCase() ?? ''
  if (name.includes('area based - 1')) return 'AB1'
  if (name.includes('area based - 2')) return 'AB2'
  if (name.includes('university')) return 'University'
  if (name.includes('college')) return 'College'
  return event?.categoryName ?? 'NSS'
}

export function GenerateReportModal({
  event,
  presentCount,
  open,
  onOpenChange,
}: GenerateReportModalProps) {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      majorObjective: '',
      scheme: '',
      organizingUnit: 'NSS-VIT',
    },
  })

  useEffect(() => {
    if (event) {
      form.reset({
        majorObjective: '',
        scheme: defaultSchemeFor(event),
        organizingUnit: 'NSS-VIT',
      })
    }
  }, [event, form])

  const onSubmit = async (values: FormValues) => {
    if (!event) return
    setSubmitting(true)
    try {
      const { filename, fileBase64 } = await generateNssReport({
        eventId: event.id,
        majorObjective: values.majorObjective,
        scheme: values.scheme,
        organizingUnit: values.organizingUnit,
      })
      triggerDownload(filename, fileBase64)
      toast.success('Report generated — downloading')
      onOpenChange(false)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to generate report'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!event) return null

  const start = new Date(event.startDate)
  const end = new Date(event.endDate)
  const dateStr = start.toLocaleDateString()
  const timeStr = `${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} — ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate NSS Report
          </DialogTitle>
          <DialogDescription>
            Event details are pulled from the database. Add the objective and any overrides — Gemini
            will draft the report.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/40 rounded-md border p-3 text-sm">
          <div className="font-medium">{event.eventName}</div>
          <div className="text-muted-foreground mt-1 space-y-0.5 text-xs">
            <div>
              {dateStr} · {timeStr}
            </div>
            <div>{event.location ?? 'No venue set'}</div>
            <div>
              {presentCount} volunteer{presentCount === 1 ? '' : 's'} marked present
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="majorObjective"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Major Objective *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Teach environmental conservation to underprivileged school students"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="scheme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheme</FormLabel>
                    <FormControl>
                      <Input placeholder="AB1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="organizingUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organizing Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="NSS-VIT" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || presentCount === 0}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Report'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
