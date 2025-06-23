'use client'

import { useState, useEffect } from 'react'

interface PWAStatusProps {
  className?: string
}

export function PWAStatus({ className = '' }: PWAStatusProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [serviceWorkerRegistered, setServiceWorkerRegistered] = useState(false)

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine)
    
    // Check if app is running in standalone mode
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true)
      setIsInstalled(true)
    }

    // Check if launched from home screen (iOS)
    if ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true) {
      setIsStandalone(true)
      setIsInstalled(true)
    }

    // Check service worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setServiceWorkerRegistered(true)
      }).catch(() => {
        setServiceWorkerRegistered(false)
      })
    }

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const statusItems = [
    {
      label: 'Connection',
      value: isOnline ? 'Online' : 'Offline',
      color: isOnline ? 'text-green-600' : 'text-red-600',
      bgColor: isOnline ? 'bg-green-100' : 'bg-red-100'
    },
    {
      label: 'Installation',
      value: isInstalled ? 'Installed' : 'Browser',
      color: isInstalled ? 'text-green-600' : 'text-orange-600',
      bgColor: isInstalled ? 'bg-green-100' : 'bg-orange-100'
    },
    {
      label: 'Mode',
      value: isStandalone ? 'Standalone' : 'Browser',
      color: isStandalone ? 'text-green-600' : 'text-blue-600',
      bgColor: isStandalone ? 'bg-green-100' : 'bg-blue-100'
    },
    {
      label: 'Service Worker',
      value: serviceWorkerRegistered ? 'Active' : 'Inactive',
      color: serviceWorkerRegistered ? 'text-green-600' : 'text-red-600',
      bgColor: serviceWorkerRegistered ? 'bg-green-100' : 'bg-red-100'
    }
  ]

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">PWA Status</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm font-medium text-gray-600">
            {isOnline ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statusItems.map((item, index) => (
          <div key={index} className="text-center">
            <div className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${item.bgColor} ${item.color} mb-2`}>
              {item.value}
            </div>
            <p className="text-xs text-gray-600 font-medium">{item.label}</p>
          </div>
        ))}
      </div>

      {!isOnline && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                You&apos;re currently offline. Some features may be limited, but you can still browse cached content.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 