<template>
  <ClientOnly>
    <div v-if="mounted && $pwa?.needRefresh" class="pwa-toast">
      <div class="message">
        <span>New content available, click on reload button to update.</span>
      </div>
      <div class="buttons">
        <button class="btn-update" @click="updateApp">
          Reload
        </button>
        <button class="btn-cancel" @click="close">
          Cancel
        </button>
      </div>
    </div>

    <div v-if="mounted && $pwa?.showInstallPrompt && !hideInstall" class="pwa-toast">
      <div class="message">
        <span>Install TaskPilot app for better experience!</span>
      </div>
      <div class="buttons">
        <button class="btn-install" @click="install">
          Install
        </button>
        <button class="btn-cancel" @click="hideInstallPrompt">
          Cancel
        </button>
      </div>
    </div>

    <div v-if="mounted && $pwa?.offlineReady && offlineReadyMessage" class="pwa-toast offline">
      <div class="message">
        <span>App ready to work offline</span>
      </div>
      <div class="buttons">
        <button class="btn-cancel" @click="offlineReadyMessage = false">
          Close
        </button>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
const { $pwa } = useNuxtApp()

const mounted = ref(false)
const hideInstall = ref(false)
const offlineReadyMessage = ref(true)

// Ensure client-side mounting
onMounted(() => {
  mounted.value = true
})

const updateApp = async () => {
  try {
    await $pwa?.updateServiceWorker()
  } catch (error) {
    console.warn('Update failed:', error)
  }
}

const close = async () => {
  try {
    await $pwa?.cancelPrompt()
  } catch (error) {
    console.warn('Cancel prompt failed:', error)
  }
}

const install = async () => {
  try {
    await $pwa?.install()
    hideInstall.value = true
  } catch (error) {
    console.warn('Install failed:', error)
  }
}

const hideInstallPrompt = () => {
  try {
    $pwa?.cancelInstall()
    hideInstall.value = true
  } catch (error) {
    console.warn('Cancel install failed:', error)
  }
}

// Watch for offline ready status
watch(() => $pwa?.offlineReady, (ready) => {
  if (ready) {
    offlineReadyMessage.value = true
    // Auto hide after 5 seconds
    setTimeout(() => {
      offlineReadyMessage.value = false
    }, 5000)
  }
})
</script>

<style scoped>
.pwa-toast {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 1000;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pwa-toast.offline {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.message {
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-update, .btn-install {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-update:hover, .btn-install:hover {
  background: #2563eb;
}

.btn-cancel {
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-cancel:hover {
  background: #4b5563;
}

.offline .btn-cancel {
  background: rgba(255, 255, 255, 0.2);
}

.offline .btn-cancel:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>