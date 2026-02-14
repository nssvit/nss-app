/**
 * Toast variant configurations
 */

import { ToastConfig, ToastVariant } from './types'

export const TOAST_VARIANTS: Record<ToastVariant, ToastConfig> = {
  success: {
    variant: 'success',
    icon: 'fa-check-circle',
    iconColor: 'var(--status-success-text)',
    iconBg: 'var(--status-success-bg)',
  },
  error: {
    variant: 'error',
    icon: 'fa-times-circle',
    iconColor: 'var(--status-error-text)',
    iconBg: 'var(--status-error-bg)',
  },
  warning: {
    variant: 'warning',
    icon: 'fa-exclamation-triangle',
    iconColor: 'var(--status-warning-text)',
    iconBg: 'var(--status-warning-bg)',
  },
  info: {
    variant: 'info',
    icon: 'fa-info-circle',
    iconColor: 'var(--status-info-text)',
    iconBg: 'var(--status-info-bg)',
  },
}

export const DEFAULT_TOAST_DURATION = 4000
