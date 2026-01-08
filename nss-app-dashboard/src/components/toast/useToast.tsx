'use client'

import { useState, useCallback } from 'react'
import { Toast, ToastVariant } from './types'
import { DEFAULT_TOAST_DURATION } from './config'

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((
    message: string,
    variant: ToastVariant = 'info',
    duration?: number,
    icon?: string
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    const newToast: Toast = {
      id,
      message,
      variant,
      duration: duration || DEFAULT_TOAST_DURATION,
      icon
    }

    setToasts((prev) => [...prev, newToast])
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const success = useCallback((message: string, duration?: number) => {
    return addToast(message, 'success', duration)
  }, [addToast])

  const error = useCallback((message: string, duration?: number) => {
    return addToast(message, 'error', duration)
  }, [addToast])

  const warning = useCallback((message: string, duration?: number) => {
    return addToast(message, 'warning', duration)
  }, [addToast])

  const info = useCallback((message: string, duration?: number) => {
    return addToast(message, 'info', duration)
  }, [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }
}
