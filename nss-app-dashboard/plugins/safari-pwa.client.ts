export default defineNuxtPlugin(() => {
  if (process.client) {
    // Safari-specific PWA fixes
    const isSafari = () => {
      return /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
             /iPad|iPhone|iPod/.test(navigator.userAgent)
    }

    if (isSafari()) {
      console.log('🍎 Safari PWA compatibility mode enabled')

      // Fix hydration issues by delaying certain operations
      const originalAddEventListener = window.addEventListener
      window.addEventListener = function(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
        // Delay PWA-related event listeners to avoid hydration conflicts
        if (type === 'beforeinstallprompt' || type === 'appinstalled') {
          setTimeout(() => {
            originalAddEventListener.call(this, type as any, listener as any, options as any)
          }, 100)
        } else {
          originalAddEventListener.call(this, type as any, listener as any, options as any)
        }
      }

      // Safari PWA detection and handling
      const handleSafariPWA = () => {
        try {
          // Check if running as standalone (installed PWA)
          const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                              (window.navigator as any).standalone === true

          if (isStandalone) {
            console.log('🍎 Running as Safari PWA')
            document.body.classList.add('safari-pwa')
          } else {
            console.log('🍎 Safari browser mode - PWA can be installed via Add to Home Screen')
          }

          // Add Safari-specific meta tags if missing
          const addMetaTag = (name: string, content: string) => {
            if (!document.querySelector(`meta[name="${name}"]`)) {
              const meta = document.createElement('meta')
              meta.name = name
              meta.content = content
              document.head.appendChild(meta)
            }
          }

          addMetaTag('apple-mobile-web-app-capable', 'yes')
          addMetaTag('apple-mobile-web-app-status-bar-style', 'default')
          addMetaTag('apple-mobile-web-app-title', 'TaskPilot')

          // Add apple-touch-icon if missing
          if (!document.querySelector('link[rel="apple-touch-icon"]')) {
            const link = document.createElement('link')
            link.rel = 'apple-touch-icon'
            link.href = '/icon-192x192.png'
            document.head.appendChild(link)
          }

        } catch (error) {
          console.warn('Safari PWA setup failed:', error)
        }
      }

      // Run Safari PWA setup after DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', handleSafariPWA)
      } else {
        handleSafariPWA()
      }

      // Override console.error to catch and handle hydration errors gracefully
      const originalConsoleError = console.error
      console.error = function(...args: any[]) {
        const errorMessage = args.join(' ')
        
        // Suppress known Safari hydration errors that don't affect functionality
        if (errorMessage.includes('currentRenderingInstance.ce') ||
            errorMessage.includes('hydration') && errorMessage.includes('Safari')) {
          console.warn('Safari hydration warning (suppressed):', errorMessage)
          return
        }
        
        originalConsoleError.apply(console, args)
      }
    }
  }
})
