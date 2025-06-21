<template>
  <ClientOnly>
    <!-- Chrome/Edge Install Prompt -->
    <div v-if="mounted && showChromeInstall" class="install-prompt chrome-install">
      <div class="prompt-content">
        <div class="prompt-header">
          <div class="app-info">
            <div class="app-icon-placeholder">
              📋
            </div>
            <div>
              <h3>Install TaskPilot</h3>
              <p class="app-url">{{ currentUrl }}</p>
            </div>
          </div>
          <button @click="closeChromePrompt" class="close-btn">×</button>
        </div>
        
        <div class="prompt-body">
          <p>Get the full app experience with:</p>
          <ul class="benefits-list">
            <li>🚀 Faster loading</li>
            <li>📱 Works offline</li>
            <li>🏠 Easy access from home screen</li>
            <li>🔔 Push notifications</li>
          </ul>
        </div>
        
        <div class="prompt-actions">
          <button @click="closeChromePrompt" class="btn-secondary">Not now</button>
          <button @click="installApp" class="btn-primary">Install</button>
        </div>
      </div>
    </div>

    <!-- Safari Install Instructions -->
    <div v-if="mounted && showSafariInstall" class="install-prompt safari-install">
      <div class="prompt-content">
        <div class="prompt-header">
          <div class="app-info">
            <div class="app-icon-placeholder">
              📋
            </div>
            <div>
              <h3>📱 Install TaskPilot</h3>
              <p class="safari-hint">Add to Home Screen for the best experience</p>
            </div>
          </div>
          <button @click="closeSafariPrompt" class="close-btn">×</button>
        </div>
        
        <div class="prompt-body">
          <div class="safari-instructions">
            <p><strong>To install on iPhone/iPad:</strong></p>
            <ol class="install-steps">
              <li>
                <span class="step-icon">📤</span>
                Tap the <strong>Share</strong> button in Safari
              </li>
              <li>
                <span class="step-icon">🏠</span>
                Scroll down and tap <strong>"Add to Home Screen"</strong>
              </li>
              <li>
                <span class="step-icon">✅</span>
                Tap <strong>"Add"</strong> to confirm
              </li>
            </ol>
          </div>
          
          <div class="benefits">
            <h4>Why install?</h4>
            <ul class="benefits-list">
              <li>🚀 Lightning fast access</li>
              <li>📱 Full-screen experience</li>
              <li>🔄 Works without internet</li>
              <li>📍 Easy to find on home screen</li>
            </ul>
          </div>
        </div>
        
        <div class="prompt-actions">
          <button @click="closeSafariPrompt" class="btn-secondary">Maybe Later</button>
          <button @click="closeSafariPrompt" class="btn-primary">Got It!</button>
        </div>
      </div>
    </div>

    <!-- Install Success Message -->
    <div v-if="mounted && showInstallSuccess" class="install-prompt success-message">
      <div class="prompt-content">
        <div class="success-content">
          <div class="success-icon">🎉</div>
          <h3>Successfully Installed!</h3>
          <p>TaskPilot is now available on your home screen</p>
          <button @click="showInstallSuccess = false" class="btn-primary">Awesome!</button>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const mounted = ref(false)
const showChromeInstall = ref(false)
const showSafariInstall = ref(false)
const showInstallSuccess = ref(false)
const deferredPrompt = ref(null)
const currentUrl = ref('')

// Browser detection
const isSafari = () => {
  if (typeof window === 'undefined') return false
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
         /iPad|iPhone|iPod/.test(navigator.userAgent)
}

const isChrome = () => {
  if (typeof window === 'undefined') return false
  return /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent)
}

const isInstalled = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true
}

// Chrome install functions
const installApp = async () => {
  if (!deferredPrompt.value) return
  
  try {
    // Show the install prompt
    await deferredPrompt.value.prompt()
    
    // Wait for the user to respond
    const { outcome } = await deferredPrompt.value.userChoice
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
      showInstallSuccess.value = true
      // Remember that user installed
      localStorage.setItem('pwa-installed', 'true')
    } else {
      console.log('User dismissed the install prompt')
      // Remember that user dismissed
      localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    }
    
    showChromeInstall.value = false
    deferredPrompt.value = null
  } catch (error) {
    console.error('Error during install:', error)
  }
}

const closeChromePrompt = () => {
  showChromeInstall.value = false
  // Remember dismissal for 7 days
  const dismissedUntil = Date.now() + (7 * 24 * 60 * 60 * 1000)
  localStorage.setItem('pwa-install-dismissed', dismissedUntil.toString())
}

const closeSafariPrompt = () => {
  showSafariInstall.value = false
  // Remember dismissal for 7 days
  const dismissedUntil = Date.now() + (7 * 24 * 60 * 60 * 1000)
  localStorage.setItem('safari-install-dismissed', dismissedUntil.toString())
}

// Check if user has dismissed the prompt recently
const wasRecentlyDismissed = (key) => {
  const dismissed = localStorage.getItem(key)
  if (!dismissed) return false
  
  const dismissedTime = parseInt(dismissed)
  return Date.now() < dismissedTime
}

onMounted(() => {
  mounted.value = true
  currentUrl.value = window.location.href

  // Skip if already installed
  if (isInstalled()) {
    console.log('PWA already installed')
    return
  }

  // Skip if user recently dismissed
  if (wasRecentlyDismissed('pwa-install-dismissed') || 
      wasRecentlyDismissed('safari-install-dismissed')) {
    console.log('Install prompt recently dismissed')
    return
  }

  // Listen for Chrome/Edge beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('beforeinstallprompt event fired!')
    e.preventDefault()
    deferredPrompt.value = e
    
    // Show Chrome install prompt after a short delay
    setTimeout(() => {
      if (!isInstalled() && !wasRecentlyDismissed('pwa-install-dismissed')) {
        showChromeInstall.value = true
      }
    }, 3000)
  })

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed!')
    showChromeInstall.value = false
    showSafariInstall.value = false
    showInstallSuccess.value = true
    localStorage.setItem('pwa-installed', 'true')
  })

  // Safari handling
  if (isSafari() && !isInstalled()) {
    // Show Safari instructions after a delay
    setTimeout(() => {
      if (!wasRecentlyDismissed('safari-install-dismissed')) {
        showSafariInstall.value = true
      }
    }, 5000)
  }

  // For other browsers (Edge, Firefox, etc.) that might not fire beforeinstallprompt immediately
  if (!isSafari() && !isChrome()) {
    setTimeout(() => {
      // If no beforeinstallprompt fired after 10 seconds, check manually
      if (!deferredPrompt.value && !isInstalled()) {
        console.log('No beforeinstallprompt detected, checking installability...')
        // You could show a generic install message here
      }
    }, 10000)
  }
})

// Expose functions for debugging
if (process.client) {
  window.debugInstallPrompt = {
    showChrome: () => { showChromeInstall.value = true },
    showSafari: () => { showSafariInstall.value = true },
    showSuccess: () => { showInstallSuccess.value = true },
    clearDismissals: () => {
      localStorage.removeItem('pwa-install-dismissed')
      localStorage.removeItem('safari-install-dismissed')
      console.log('Install prompt dismissals cleared')
    }
  }
}
</script>

<style scoped>
.install-prompt {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.prompt-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 420px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.prompt-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 24px 16px;
  border-bottom: 1px solid #f1f5f9;
}

.app-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.app-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  object-fit: cover;
}

.app-icon-placeholder {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.app-info h3 {
  margin: 0 0 4px 0;
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 600;
}

.app-url {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0;
}

.safari-hint {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #64748b;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #334155;
}

.prompt-body {
  padding: 0 24px 24px;
}

.prompt-body p {
  color: #475569;
  margin: 0 0 16px 0;
  font-size: 0.95rem;
}

.benefits-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.benefits-list li {
  display: flex;
  align-items: center;
  padding: 8px 0;
  color: #475569;
  font-size: 0.9rem;
}

.safari-instructions {
  margin-bottom: 20px;
}

.install-steps {
  list-style: none;
  padding: 0;
  margin: 12px 0 0 0;
}

.install-steps li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
}

.install-steps li:last-child {
  border-bottom: none;
}

.step-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.benefits {
  background: #f0f9ff;
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
}

.benefits h4 {
  margin: 0 0 12px 0;
  color: #0369a1;
  font-size: 0.95rem;
  font-weight: 600;
}

.benefits .benefits-list li {
  padding: 4px 0;
  color: #0c4a6e;
  font-size: 0.85rem;
}

.prompt-actions {
  display: flex;
  gap: 12px;
  padding: 0 24px 24px;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 14px 20px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover {
  background: #f1f5f9;
}

/* Success message styles */
.success-message .prompt-content {
  text-align: center;
  padding: 40px 24px;
}

.success-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.success-icon {
  font-size: 3rem;
  margin-bottom: 8px;
}

.success-content h3 {
  color: #059669;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.success-content p {
  color: #6b7280;
  margin: 0 0 20px 0;
}

.success-content .btn-primary {
  min-width: 120px;
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .install-prompt {
    padding: 10px;
  }
  
  .prompt-content {
    border-radius: 12px;
  }
  
  .app-icon {
    width: 48px;
    height: 48px;
  }
  
  .app-info h3 {
    font-size: 1.1rem;
  }
  
  .prompt-actions {
    flex-direction: column;
  }
}

/* Chrome install specific styles */
.chrome-install .prompt-content {
  border-top: 4px solid #3b82f6;
}

/* Safari install specific styles */
.safari-install .prompt-content {
  border-top: 4px solid #06b6d4;
}
</style>
