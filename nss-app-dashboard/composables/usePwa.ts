import type { ComputedRef } from 'vue'

/**
 * PWA Composable Return Type
 */
interface UsePwaReturn {
  // State
  isPwaAvailable: ComputedRef<boolean>
  isInstalled: ComputedRef<boolean>
  updateAvailable: ComputedRef<boolean>
  offlineReady: ComputedRef<boolean>
  showInstallPrompt: ComputedRef<boolean>
  swActivated: ComputedRef<boolean>
  registrationError: ComputedRef<boolean>
  canInstall: ComputedRef<boolean>
  
  // Methods
  installPwa: () => Promise<boolean>
  updatePwa: (reloadPage?: boolean) => Promise<boolean>
  cancelInstall: () => void
  cancelUpdate: () => Promise<void>
  getSwRegistration: () => ServiceWorkerRegistration | undefined
  checkInstallability: () => Promise<boolean>
  
  // Direct access to $pwa for advanced usage
  $pwa: any
}

/**
 * Composable for managing PWA functionality
 * Provides helper methods and reactive state for PWA features
 */
export const usePwa = (): UsePwaReturn => {
  const nuxtApp = useNuxtApp()
  const { $pwa } = nuxtApp

  // Check if PWA is available with safety checks
  const isPwaAvailable = computed(() => {
    try {
      return process.client && !!$pwa
    } catch {
      return false
    }
  })

  // Check if app is installed
  const isInstalled = computed(() => {
    try {
      return $pwa?.isPWAInstalled || false
    } catch {
      return false
    }
  })

  // Check if update is available
  const updateAvailable = computed(() => {
    try {
      return $pwa?.needRefresh || false
    } catch {
      return false
    }
  })

  // Check if app is ready to work offline
  const offlineReady = computed(() => {
    try {
      return $pwa?.offlineReady || false
    } catch {
      return false
    }
  })

  // Check if install prompt is available
  const showInstallPrompt = computed(() => {
    try {
      return $pwa?.showInstallPrompt || false
    } catch {
      return false
    }
  })

  // Check if service worker is activated
  const swActivated = computed(() => {
    try {
      return $pwa?.swActivated || false
    } catch {
      return false
    }
  })

  // Check for registration errors
  const registrationError = computed(() => {
    try {
      return $pwa?.registrationError || false
    } catch {
      return false
    }
  })

  // Check if app can be installed (native browser prompt or custom prompt)
  const canInstall = computed(() => {
    try {
      if (!process.client) return false
      
      // Check for native beforeinstallprompt support
      return !!(window as any).deferredPrompt || showInstallPrompt.value || 
             (navigator.userAgent.includes('Chrome') && !isInstalled.value)
    } catch {
      return false
    }
  })

  // Install the PWA
  const installPwa = async (): Promise<boolean> => {
    try {
      if (!$pwa?.install) {
        console.warn('PWA install function not available')
        return false
      }
      
      await $pwa.install()
      return true
    } catch (error) {
      console.error('Failed to install PWA:', error)
      return false
    }
  }

  // Update the service worker
  const updatePwa = async (reloadPage = true): Promise<boolean> => {
    try {
      if (!$pwa?.updateServiceWorker) {
        console.warn('PWA updateServiceWorker function not available')
        return false
      }
      
      await $pwa.updateServiceWorker(reloadPage)
      return true
    } catch (error) {
      console.error('Failed to update PWA:', error)
      return false
    }
  }

  // Cancel install prompt
  const cancelInstall = (): void => {
    try {
      if ($pwa?.cancelInstall) {
        $pwa.cancelInstall()
      } else {
        console.warn('PWA cancelInstall function not available')
      }
    } catch (error) {
      console.warn('Failed to cancel install:', error)
    }
  }

  // Cancel update prompt
  const cancelUpdate = async (): Promise<void> => {
    try {
      if (!$pwa?.cancelPrompt) {
        console.warn('PWA cancelPrompt function not available')
        return
      }
      
      await $pwa.cancelPrompt()
    } catch (error) {
      console.error('Failed to cancel update prompt:', error)
    }
  }

  // Get service worker registration
  const getSwRegistration = (): ServiceWorkerRegistration | undefined => {
    try {
      return $pwa?.getSWRegistration?.()
    } catch {
      return undefined
    }
  }

  // Check PWA installability manually
  const checkInstallability = async (): Promise<boolean> => {
    try {
      if (!process.client) return false
      
      // Check if already installed
      if (isInstalled.value) return false
      
      // Check for native beforeinstallprompt
      if ((window as any).deferredPrompt) return true
      
      // Check if PWA criteria are met
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        return !!registration && !!registration.active
      }
      
      return false
    } catch (error) {
      console.error('Error checking installability:', error)
      return false
    }
  }

  return {
    // State
    isPwaAvailable,
    isInstalled,
    updateAvailable,
    offlineReady,
    showInstallPrompt,
    swActivated,
    registrationError,
    canInstall,

    // Methods
    installPwa,
    updatePwa,
    cancelInstall,
    cancelUpdate,
    getSwRegistration,
    checkInstallability,

    // Direct access to $pwa for advanced usage
    $pwa
  }
}
