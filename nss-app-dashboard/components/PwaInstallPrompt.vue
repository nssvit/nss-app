<template>
  <div 
    v-if="showInstallPrompt" 
    class="fixed bottom-4 left-4 right-4 z-50 lg:left-auto lg:right-4 lg:max-w-sm"
  >
    <div class="card-glass p-4 rounded-xl border border-indigo-500/30 shadow-2xl">
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <i class="fas fa-mobile-alt text-white text-lg"></i>
          </div>
        </div>
        
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-semibold text-gray-100 mb-1">
            Install NSS VIT Dashboard
          </h3>
          <p class="text-xs text-gray-400 mb-3 leading-relaxed">
            Get quick access and offline features by installing our PWA
          </p>
          
          <div class="flex space-x-2">
            <button 
              @click="installPwa"
              class="button-glass-primary text-xs px-3 py-2 rounded-lg font-medium flex-1"
            >
              <i class="fas fa-download mr-1"></i>
              Install
            </button>
            <button 
              @click="dismissPrompt"
              class="button-glass-secondary text-xs px-3 py-2 rounded-lg font-medium"
            >
              Later
            </button>
          </div>
        </div>
        
        <button 
          @click="dismissPrompt" 
          class="flex-shrink-0 text-gray-500 hover:text-gray-300 p-1"
        >
          <i class="fas fa-times text-sm"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const showInstallPrompt = ref(false)
const deferredPrompt = ref(null)

// Check if PWA can be installed
const checkInstallPrompt = () => {
  // Check if already installed
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
    return false
  }
  
  // Check if prompt was dismissed recently
  const dismissed = localStorage.getItem('pwa-install-dismissed')
  if (dismissed) {
    const dismissedTime = new Date(dismissed)
    const now = new Date()
    const daysSince = (now - dismissedTime) / (1000 * 60 * 60 * 24)
    if (daysSince < 7) { // Show again after 7 days
      return false
    }
  }
  
  return true
}

// Install PWA
const installPwa = async () => {
  if (deferredPrompt.value) {
    try {
      deferredPrompt.value.prompt()
      const result = await deferredPrompt.value.userChoice
      
      if (result.outcome === 'accepted') {
        console.log('PWA installed successfully')
        showInstallPrompt.value = false
        localStorage.removeItem('pwa-install-dismissed')
      }
    } catch (error) {
      console.error('PWA installation failed:', error)
    }
    
    deferredPrompt.value = null
  } else {
    // Fallback for iOS Safari
    if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
      alert('To install this app on iOS: tap the share button and select "Add to Home Screen"')
    }
  }
}

// Dismiss prompt
const dismissPrompt = () => {
  showInstallPrompt.value = false
  localStorage.setItem('pwa-install-dismissed', new Date().toISOString())
}

// Listen for beforeinstallprompt event
onMounted(() => {
  if (process.client) {
    // Show prompt if conditions are met
    if (checkInstallPrompt()) {
      setTimeout(() => {
        showInstallPrompt.value = true
      }, 3000) // Show after 3 seconds
    }
    
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt.value = e
      
      if (checkInstallPrompt()) {
        showInstallPrompt.value = true
      }
    })
    
    // Hide prompt after successful installation
    window.addEventListener('appinstalled', () => {
      showInstallPrompt.value = false
      localStorage.removeItem('pwa-install-dismissed')
      console.log('PWA installed successfully')
    })
  }
})
</script>

<style scoped>
/* Component-specific animations */
.card-glass {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile optimizations */
@media (max-width: 640px) {
  .card-glass {
    margin: 0.5rem;
  }
}
</style> 