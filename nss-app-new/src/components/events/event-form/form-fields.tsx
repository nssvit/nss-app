'use client'

import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
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
import type { FormValues } from './event-form-modal'

export function TextField({
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

export function SelectField({
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
