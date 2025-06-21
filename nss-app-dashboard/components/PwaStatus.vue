<template>
  <div v-if="showPwaStatus" class="pwa-status-indicator">
    <div class="flex items-center space-x-2 px-3 py-1 bg-green-600/20 border border-green-500/30 rounded-full">
      <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span class="text-xs text-green-300 font-medium">PWA Mode</span>
    </div>
  </div>
</template>

<script setup>
const showPwaStatus = ref(false)

// Check if running in PWA mode
const checkPwaMode = () => {
  if (process.client) {
    // Check if app is in standalone mode (PWA)
    const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches
    const isIosPwa = (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) && !navigator.userAgent.includes('Safari')
    
    showPwaStatus.value = isStandalone || isIosPwa
    
    // Auto-hide after 5 seconds
    if (showPwaStatus.value) {
      setTimeout(() => {
        showPwaStatus.value = false
      }, 5000)
    }
  }
}

onMounted(() => {
  checkPwaMode()
  
  // Listen for app install event
  if (process.client) {
    window.addEventListener('appinstalled', () => {
      showPwaStatus.value = true
      setTimeout(() => {
        showPwaStatus.value = false
      }, 5000)
    })
  }
})
</script>

<style scoped>
.pwa-status-indicator {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .pwa-status-indicator {
    top: 0.5rem;
    right: 0.5rem;
  }
}

/* PWA standalone mode adjustments */
@media (display-mode: standalone) {
  .pwa-status-indicator {
    top: calc(env(safe-area-inset-top) + 1rem);
  }
}
</style> 