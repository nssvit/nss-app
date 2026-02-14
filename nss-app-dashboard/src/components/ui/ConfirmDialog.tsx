'use client'

import { useEffect } from 'react'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'warning' | 'info'
  icon?: string
}

const VARIANT_CONFIG = {
  danger: {
    defaultIcon: 'fa-exclamation-triangle',
    iconColor: 'var(--status-error-text)',
    iconBg: 'var(--status-error-bg)',
    buttonClass: 'btn btn-md btn-danger',
  },
  warning: {
    defaultIcon: 'fa-exclamation-circle',
    iconColor: 'var(--status-warning-text)',
    iconBg: 'var(--status-warning-bg)',
    buttonClass: 'btn btn-md btn-primary',
  },
  info: {
    defaultIcon: 'fa-info-circle',
    iconColor: 'var(--status-info-text)',
    iconBg: 'var(--status-info-bg)',
    buttonClass: 'btn btn-md btn-primary',
  },
} as const

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
  icon,
}: ConfirmDialogProps) {
  // Handle ESC key and body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onCancel()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const config = VARIANT_CONFIG[variant]
  const displayIcon = icon || config.defaultIcon

  const handleConfirm = () => {
    onConfirm()
    onCancel()
  }

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--modal-backdrop)' }}
      onClick={onCancel}
    >
      {/* Dialog */}
      <div
        className="card-elevated animate-scale-in w-full max-w-md rounded-xl p-6"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--modal-bg)' }}
      >
        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: config.iconBg }}
          >
            <i className={`fas ${displayIcon} text-2xl`} style={{ color: config.iconColor }}></i>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-heading-3 mb-2 text-center">{title}</h3>

        {/* Message */}
        <p className="text-body mb-6 text-center" style={{ color: 'var(--text-secondary)' }}>
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button className="btn btn-md btn-secondary flex-1" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`${config.buttonClass} flex-1`} onClick={handleConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
