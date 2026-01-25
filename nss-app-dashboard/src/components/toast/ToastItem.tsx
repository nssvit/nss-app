'use client'

import { useEffect, useState } from 'react'
import { TOAST_VARIANTS } from './config'
import { Toast } from './types'

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

export function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isLeaving, setIsLeaving] = useState(false)
  const config = TOAST_VARIANTS[toast.variant]
  const displayIcon = toast.icon || config.icon

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true)
      setTimeout(() => onRemove(toast.id), 300)
    }, toast.duration || 4000)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  return (
    <div
      className={`card-glass flex items-start gap-3 rounded-lg p-4 shadow-lg transition-all duration-300 ${
        isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
      style={{
        minWidth: '320px',
        maxWidth: '420px',
        background: 'var(--bg-surface)',
      }}
    >
      {/* Icon */}
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ background: config.iconBg }}
      >
        <i className={`fas ${displayIcon} text-lg`} style={{ color: config.iconColor }}></i>
      </div>

      {/* Message */}
      <p className="text-body-sm flex-1 pt-1.5" style={{ color: 'var(--text-primary)' }}>
        {toast.message}
      </p>

      {/* Close Button */}
      <button
        onClick={() => {
          setIsLeaving(true)
          setTimeout(() => onRemove(toast.id), 300)
        }}
        className="btn btn-icon btn-sm btn-ghost ml-2"
        style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px' }}
      >
        <i className="fas fa-times"></i>
      </button>
    </div>
  )
}
