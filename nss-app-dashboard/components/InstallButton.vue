<template>
  <ClientOnly>
    <button 
      v-if="mounted && canInstall" 
      @click="handleInstall"
      class="install-button"
      :disabled="isInstalling"
    >
      <span v-if="!isInstalling" class="button-content">
        📱 Install App
      </span>
      <span v-else class="button-content">
        ⏳ Installing...
      </span>
    </button>
  </ClientOnly>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const mounted = ref(false)
const canInstall = ref(false)
const isInstalling = ref(false)
const deferredPrompt = ref(null)

// Check if PWA can be installed
const checkInstallability = () => {
  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true) {
    canInstall.value = false
    return
  }

  // Check if we have a deferred prompt
  if (deferredPrompt.value) {
    canInstall.value = true
    return
  }

  // For Safari and other browsers without beforeinstallprompt
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
                   /iPad|iPhone|iPod/.test(navigator.userAgent)
  
  if (isSafari) {
    canInstall.value = true
  }
}

const handleInstall = async () => {
  if (isInstalling.value) return

  isInstalling.value = true

  try {
    if (deferredPrompt.value) {
      // Chrome/Edge installation
      await deferredPrompt.value.prompt()
      const { outcome } = await deferredPrompt.value.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
        localStorage.setItem('pwa-installed', 'true')
        canInstall.value = false
      }
      
      deferredPrompt.value = null
    } else {
      // Safari or other browsers - show instructions
      alert('To install on Safari:\n1. Tap the Share button\n2. Tap "Add to Home Screen"\n3. Tap "Add"')
    }
  } catch (error) {
    console.error('Installation failed:', error)
  } finally {
    isInstalling.value = false
  }
}

onMounted(() => {
  mounted.value = true
  
  // Listen for beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
    checkInstallability()
  })

  // Listen for app installed
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed')
    canInstall.value = false
    localStorage.setItem('pwa-installed', 'true')
  })

  checkInstallability()
})
</script>

<style scoped>
.install-button {
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
  position: relative;
  overflow: hidden;
}

.install-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.install-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.button-content {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

@media (max-width: 640px) {
  .install-button {
    width: 100%;
    padding: 14px 20px;
  }
}
</style>