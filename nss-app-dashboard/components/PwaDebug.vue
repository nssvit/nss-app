<template>
  <ClientOnly>
    <div v-if="mounted && showDebug" class="pwa-debug">
      <div class="pwa-debug-header">
        <h3>PWA Debug Info</h3>
        <button @click="showDebug = false" class="close-btn">×</button>
      </div>
      <div class="pwa-debug-content">
        <div class="debug-item">
          <strong>PWA Available:</strong>
          <span :class="{ active: isPwaAvailable }">{{ isPwaAvailable ? 'Yes' : 'No' }}</span>
        </div>
        <div class="debug-item">
          <strong>Installed:</strong>
          <span :class="{ active: isInstalled }">{{ isInstalled ? 'Yes' : 'No' }}</span>
        </div>
        <div class="debug-item">
          <strong>Update Available:</strong>
          <span :class="{ active: updateAvailable }">{{ updateAvailable ? 'Yes' : 'No' }}</span>
        </div>
        <div class="debug-item">
          <strong>Offline Ready:</strong>
          <span :class="{ active: offlineReady }">{{ offlineReady ? 'Yes' : 'No' }}</span>
        </div>
        <div class="debug-item">
          <strong>Install Prompt:</strong>
          <span :class="{ active: showInstallPrompt }">{{ showInstallPrompt ? 'Available' : 'Not Available' }}</span>
        </div>
        <div class="debug-item">
          <strong>SW Activated:</strong>
          <span :class="{ active: swActivated }">{{ swActivated ? 'Yes' : 'No' }}</span>
        </div>
        <div class="debug-item">
          <strong>Registration Error:</strong>
          <span :class="{ error: registrationError }">{{ registrationError ? 'Yes' : 'No' }}</span>
        </div>
      </div>
      <div class="debug-actions">
        <button v-if="updateAvailable" @click="updatePwa" class="debug-btn">
          Update SW
        </button>
        <button v-if="showInstallPrompt" @click="installPwa" class="debug-btn">
          Install PWA
        </button>
        <button @click="refreshDebug" class="debug-btn secondary">
          Refresh
        </button>
      </div>
    </div>
    
    <!-- Toggle button -->
    <button v-if="mounted && !showDebug && isDev" @click="showDebug = true" class="debug-toggle">
      PWA Debug
    </button>
  </ClientOnly>
</template>

<script setup>
const { 
  isPwaAvailable, 
  isInstalled, 
  updateAvailable, 
  offlineReady, 
  showInstallPrompt, 
  swActivated, 
  registrationError,
  installPwa,
  updatePwa
} = usePwa()

const mounted = ref(false)
const showDebug = ref(false)
const isDev = process.dev

// Ensure client-side mounting
onMounted(() => {
  mounted.value = true
})

const refreshDebug = () => {
  // Force reactivity update
  showDebug.value = false
  nextTick(() => {
    showDebug.value = true
  })
}
</script>

<style scoped>
.pwa-debug {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1001;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  border-radius: 0.5rem;
  padding: 1rem;
  min-width: 300px;
  font-family: monospace;
  font-size: 0.875rem;
}

.pwa-debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  border-bottom: 1px solid #374151;
  padding-bottom: 0.5rem;
}

.pwa-debug-header h3 {
  margin: 0;
  color: #60a5fa;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #ef4444;
}

.pwa-debug-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.debug-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.debug-item strong {
  color: #9ca3af;
}

.debug-item span {
  color: #ef4444;
}

.debug-item span.active {
  color: #10b981;
}

.debug-item span.error {
  color: #ef4444;
  font-weight: bold;
}

.debug-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.debug-btn {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.debug-btn:hover {
  background: #2563eb;
}

.debug-btn.secondary {
  background: #6b7280;
}

.debug-btn.secondary:hover {
  background: #4b5563;
}

.debug-toggle {
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  z-index: 1000;
  background: #374151;
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.debug-toggle:hover {
  background: #4b5563;
}
</style>