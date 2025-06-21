<template>
  <div class="install-test-page">
    <div class="container">
      <h1>PWA Install Test</h1>
      <p class="description">
        This page helps you test the PWA installation functionality.
      </p>

      <div class="test-section">
        <h2>Install Status</h2>
        <div class="status-card">
          <div class="status-item">
            <span class="label">Browser:</span>
            <span class="value">{{ browserInfo }}</span>
          </div>
          <div class="status-item">
            <span class="label">PWA Installed:</span>
            <span class="value" :class="{ 'installed': isInstalled, 'not-installed': !isInstalled }">
              {{ isInstalled ? 'Yes' : 'No' }}
            </span>
          </div>
          <div class="status-item">
            <span class="label">Install Prompt Available:</span>
            <span class="value" :class="{ 'available': canShowPrompt, 'not-available': !canShowPrompt }">
              {{ canShowPrompt ? 'Yes' : 'No' }}
            </span>
          </div>
        </div>
      </div>

      <div class="test-section">
        <h2>Install Components</h2>
        <div class="components-grid">
          <div class="component-card">
            <h3>Install Button</h3>
            <InstallButton />
          </div>
          
          <div class="component-card">
            <h3>Manual Triggers</h3>
            <div class="button-group">
              <button @click="showChromePrompt" class="test-btn">
                Show Chrome Prompt
              </button>
              <button @click="showSafariPrompt" class="test-btn">
                Show Safari Prompt
              </button>
              <button @click="clearStorage" class="test-btn secondary">
                Clear Storage
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="test-section">
        <h2>Debug Info</h2>
        <div class="debug-card">
          <pre>{{ debugInfo }}</pre>
        </div>
      </div>
    </div>

    <!-- Install Prompts -->
    <InstallPrompt />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const isInstalled = ref(false)
const canShowPrompt = ref(false)
const userAgent = ref('')
const deferredPrompt = ref(null)

const browserInfo = computed(() => {
  if (!userAgent.value) return 'Unknown'
  
  if (/Chrome/.test(userAgent.value) && !/Edg/.test(userAgent.value)) return 'Chrome'
  if (/Safari/.test(userAgent.value) && !/Chrome/.test(userAgent.value)) return 'Safari'
  if (/Edg/.test(userAgent.value)) return 'Edge'
  if (/Firefox/.test(userAgent.value)) return 'Firefox'
  
  return 'Other'
})

const debugInfo = computed(() => {
  return JSON.stringify({
    userAgent: userAgent.value,
    isInstalled: isInstalled.value,
    canShowPrompt: canShowPrompt.value,
    hasDeferredPrompt: !!deferredPrompt.value,
    displayMode: typeof window !== 'undefined' ? window.matchMedia('(display-mode: standalone)').matches : false,
    standalone: typeof window !== 'undefined' ? window.navigator.standalone : false,
    localStorage: {
      pwaInstalled: typeof localStorage !== 'undefined' ? localStorage.getItem('pwa-installed') : null,
      pwaInstallDismissed: typeof localStorage !== 'undefined' ? localStorage.getItem('pwa-install-dismissed') : null,
      safariInstallDismissed: typeof localStorage !== 'undefined' ? localStorage.getItem('safari-install-dismissed') : null
    }
  }, null, 2)
})

const checkInstallStatus = () => {
  if (typeof window === 'undefined') return
  
  isInstalled.value = window.matchMedia('(display-mode: standalone)').matches ||
                     window.navigator.standalone === true
  
  canShowPrompt.value = !!deferredPrompt.value || 
                       (/Safari/.test(navigator.userAgent) && !isInstalled.value)
}

const showChromePrompt = () => {
  if (typeof window !== 'undefined' && window.debugInstallPrompt) {
    window.debugInstallPrompt.showChrome()
  }
}

const showSafariPrompt = () => {
  if (typeof window !== 'undefined' && window.debugInstallPrompt) {
    window.debugInstallPrompt.showSafari()
  }
}

const clearStorage = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('pwa-installed')
    localStorage.removeItem('pwa-install-dismissed')
    localStorage.removeItem('safari-install-dismissed')
    
    if (typeof window !== 'undefined' && window.debugInstallPrompt) {
      window.debugInstallPrompt.clearDismissals()
    }
    
    alert('Storage cleared! Refresh the page to see changes.')
  }
}

onMounted(() => {
  userAgent.value = navigator.userAgent
  
  // Listen for beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
    checkInstallStatus()
  })

  // Listen for app installed
  window.addEventListener('appinstalled', () => {
    checkInstallStatus()
  })

  checkInstallStatus()
})

// Meta
useHead({
  title: 'PWA Install Test - TaskPilot',
  meta: [
    { name: 'description', content: 'Test page for PWA installation functionality' }
  ]
})
</script>

<style scoped>
.install-test-page {
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: white;
  text-align: center;
  margin-bottom: 10px;
  font-size: 2.5rem;
  font-weight: 700;
}

.description {
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  margin-bottom: 40px;
  font-size: 1.1rem;
}

.test-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.test-section h2 {
  margin: 0 0 20px 0;
  color: #1e293b;
  font-size: 1.5rem;
  font-weight: 600;
}

.status-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;
}

.status-item:last-child {
  border-bottom: none;
}

.label {
  font-weight: 600;
  color: #475569;
}

.value {
  font-weight: 500;
}

.value.installed,
.value.available {
  color: #059669;
}

.value.not-installed,
.value.not-available {
  color: #dc2626;
}

.components-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.component-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
}

.component-card h3 {
  margin: 0 0 16px 0;
  color: #1e293b;
  font-size: 1.1rem;
  font-weight: 600;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.test-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: #3b82f6;
  color: white;
}

.test-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.test-btn.secondary {
  background: #6b7280;
}

.test-btn.secondary:hover {
  background: #4b5563;
}

.debug-card {
  background: #1e293b;
  border-radius: 12px;
  padding: 20px;
  overflow-x: auto;
}

.debug-card pre {
  color: #e2e8f0;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  margin: 0;
  white-space: pre-wrap;
}

@media (max-width: 768px) {
  .install-test-page {
    padding: 10px;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .test-section {
    padding: 16px;
  }
  
  .components-grid {
    grid-template-columns: 1fr;
  }
  
  .status-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>