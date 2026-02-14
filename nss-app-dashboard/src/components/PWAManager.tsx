'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration)
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error)
        })
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice

      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
      }

      setDeferredPrompt(null)
      setIsInstallable(false)
    } catch (error) {
      console.error('Error during installation:', error)
    }
  }

  if (isInstalled || !isInstallable) {
    return null
  }

  return (
    <div className="fixed right-4 bottom-4 left-4 z-50 md:right-4 md:left-auto md:max-w-sm">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h3 className="mb-1 text-base font-medium text-gray-900">Install App</h3>
            <p className="text-sm text-gray-600">
              Add this app to your home screen for quick access and offline use
            </p>
          </div>
          <div className="flex gap-3 sm:ml-4">
            <button
              onClick={() => setIsInstallable(false)}
              className="h-11 min-w-[2.75rem] rounded-md px-4 text-sm font-medium text-gray-600 transition-colors hover:text-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
              aria-label="Dismiss install prompt"
            >
              Later
            </button>
            <button
              onClick={handleInstallClick}
              className="h-11 min-w-[2.75rem] rounded-md bg-gray-900 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
              aria-label="Install PWA app"
            >
              Install
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
