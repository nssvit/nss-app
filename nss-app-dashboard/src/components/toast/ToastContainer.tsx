'use client'

import { ToastItem } from './ToastItem'
import { Toast } from './types'

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-3"
      style={{ maxHeight: 'calc(100vh - 2rem)' }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  )
}
