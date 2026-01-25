'use client'

import { useEffect } from 'react'

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  onClose: () => void
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600/90 border-green-500/50'
      case 'error':
        return 'bg-red-600/90 border-red-500/50'
      case 'warning':
        return 'bg-yellow-600/90 border-yellow-500/50'
      default:
        return 'bg-indigo-600/90 border-indigo-500/50'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'fas fa-check-circle'
      case 'error':
        return 'fas fa-exclamation-circle'
      case 'warning':
        return 'fas fa-exclamation-triangle'
      default:
        return 'fas fa-info-circle'
    }
  }

  return (
    <div
      className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 animate-slide-up ${getToastStyles()} border backdrop-blur-sm rounded-lg shadow-lg px-4 py-3 max-w-sm`}
      role="alert"
    >
      <div className="flex items-center space-x-3">
        <i className={`${getIcon()} text-white text-lg`}></i>
        <p className="text-white text-sm font-medium flex-1">{message}</p>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors focus:outline-none"
          aria-label="Close notification"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  )
}

export interface ToastContainerProps {
  toasts: Array<{
    id: string
    message: string
    type?: 'success' | 'error' | 'info' | 'warning'
  }>
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  )
}
