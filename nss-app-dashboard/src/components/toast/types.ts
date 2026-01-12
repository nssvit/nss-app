/**
 * Toast notification types and interfaces
 */

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
  duration?: number
  icon?: string
}

export interface ToastConfig {
  variant: ToastVariant
  icon: string
  iconColor: string
  iconBg: string
}
