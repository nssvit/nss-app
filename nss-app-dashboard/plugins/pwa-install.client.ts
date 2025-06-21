export default defineNuxtPlugin(() => {
  if (process.client) {
    let deferredPrompt: any = null

    // Safari compatibility check
    const isSafari = () => {
      return /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
             /iPad|iPhone|iPod/.test(navigator.userAgent)
    }

    // Debug function to check PWA installability criteria
    const debugInstallability = () => {
      console.log('=== PWA Installability Debug ===')
      console.log('URL:', window.location.href)
      console.log('Protocol:', window.location.protocol)
      console.log('User Agent:', navigator.userAgent)
      console.log('Is Safari:', isSafari())
      console.log('Service Worker support:', 'serviceWorker' in navigator)
      console.log('Manifest link:', !!document.querySelector('link[rel="manifest"]'))
      console.log('Display mode:', window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser')
      
      // Check service worker status
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
          console.log('SW Registration:', !!registration)
          console.log('SW Active:', !!registration?.active)
          console.log('SW State:', registration?.active?.state)
        }).catch(err => console.log('SW Registration error:', err))
      }
      
      // Check manifest
      fetch('/manifest.webmanifest').then(response => {
        console.log('Manifest fetch status:', response.status)
        return response.json()
      }).then(manifest => {
        console.log('Manifest data:', manifest)
        console.log('Manifest start_url:', manifest.start_url)
        console.log('Manifest display:', manifest.display)
        console.log('Manifest icons count:', manifest.icons?.length)
      }).catch(err => console.log('Manifest fetch error:', err))
    }

    // Listen for the beforeinstallprompt event (mainly Chrome/Edge)
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('🎉 beforeinstallprompt event fired!')
      
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      
      // Stash the event so it can be triggered later
      deferredPrompt = e
      ;(window as any).deferredPrompt = e
      
      // Update UI to notify the user they can install the PWA
      console.log('✅ PWA install prompt is now available')
      
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('pwainstallpromptavailable'))
    })

    // Safari-specific PWA detection
    if (isSafari()) {
      console.log('🍎 Safari detected - PWA install via Add to Home Screen')
      
      // Check if running as PWA in Safari
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone === true
      
      if (!isStandalone) {
        // Safari doesn't support beforeinstallprompt, show custom instructions
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('safaripwainstallable'))
        }, 1000)
      }
    }

    // Listen for the appinstalled event
    window.addEventListener('appinstalled', () => {
      console.log('🎉 PWA was installed successfully!')
      deferredPrompt = null
      ;(window as any).deferredPrompt = null
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('pwainstalled'))
    })

    // Check if PWA is already installed
    if ((window as any).matchMedia('(display-mode: standalone)').matches ||
        (window as any).navigator.standalone === true) {
      console.log('ℹ️ PWA is running in standalone mode')
    }

    // Debug installability after a short delay to ensure everything is loaded
    setTimeout(() => {
      try {
        debugInstallability()
        
        // Check for common issues
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          console.warn('⚠️ PWA requires HTTPS in production')
        }
        
        if (isSafari()) {
          console.log('🍎 Safari PWA Notes:')
          console.log('- Use Add to Home Screen for installation')
          console.log('- beforeinstallprompt is not supported')
          console.log('- Check display-mode for standalone detection')
        }
        
        if (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
          console.log('ℹ️ Testing PWA installability on localhost/development server')
        }
      } catch (error) {
        console.warn('PWA debug failed:', error)
      }
    }, 2000)

    // Expose install function globally for debugging
    ;(window as any).debugPWAInstall = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt()
        deferredPrompt.userChoice.then((choiceResult: any) => {
          console.log('User choice:', choiceResult.outcome)
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt')
          } else {
            console.log('User dismissed the install prompt')
          }
          deferredPrompt = null
        })
      } else {
        console.log('No deferred prompt available')
        debugInstallability()
      }
    }
  }
})
