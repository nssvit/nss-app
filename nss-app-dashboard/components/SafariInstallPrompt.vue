<template>
  <ClientOnly>
    <div v-if="mounted && showSafariInstructions" class="safari-install-prompt">
      <div class="prompt-content">
        <div class="prompt-header">
          <h3>📱 Install TaskPilot</h3>
          <button @click="closePrompt" class="close-btn">×</button>
        </div>
        
        <div class="prompt-body">
          <p>To install TaskPilot on Safari:</p>
          <ol class="install-steps">
            <li>Tap the <strong>Share</strong> button in Safari</li>
            <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
            <li>Tap <strong>"Add"</strong> to confirm</li>
          </ol>
          
          <div class="benefits">
            <h4>Benefits of installing:</h4>
            <ul>
              <li>✓ Quick access from home screen</li>
              <li>✓ Full-screen experience</li>
              <li>✓ Works offline</li>
              <li>✓ Native app-like feel</li>
            </ul>
          </div>
        </div>
        
        <div class="prompt-actions">
          <button @click="closePrompt" class="btn-secondary">Maybe Later</button>
          <button @click="closePrompt" class="btn-primary">Got It!</button>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const mounted = ref(false)
const showSafariInstructions = ref(false)

// Detect Safari
const isSafari = () => {
  if (typeof window === 'undefined') return false
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
         /iPad|iPhone|iPod/.test(navigator.userAgent)
}

// Check if already installed
const isInstalled = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator.standalone === true)
}

onMounted(() => {
  mounted.value = true
  
  // Show prompt for Safari users who haven't installed the app
  if (isSafari() && !isInstalled()) {
    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('safari-install-dismissed')
    if (!dismissed) {
      // Show prompt after a delay
      setTimeout(() => {
        showSafariInstructions.value = true
      }, 3000)
    }
  }
  
  // Listen for custom Safari PWA installable event
  window.addEventListener('safaripwainstallable', () => {
    if (!isInstalled()) {
      showSafariInstructions.value = true
    }
  })
})

const closePrompt = () => {
  showSafariInstructions.value = false
  // Remember that user dismissed the prompt
  localStorage.setItem('safari-install-dismissed', 'true')
}
</script>

<style scoped>
.safari-install-prompt {
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;
  z-index: 1000;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid #e5e7eb;
  max-width: 400px;
  margin: 0 auto;
}

.prompt-content {
  padding: 20px;
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.prompt-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.close-btn:hover {
  background: #f3f4f6;
}

.install-steps {
  margin: 16px 0;
  padding-left: 20px;
}

.install-steps li {
  margin: 8px 0;
  color: #374151;
}

.benefits {
  margin-top: 16px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 8px;
}

.benefits h4 {
  margin: 0 0 8px 0;
  color: #0369a1;
  font-size: 0.9rem;
}

.benefits ul {
  margin: 0;
  padding-left: 16px;
}

.benefits li {
  color: #0c4a6e;
  font-size: 0.85rem;
  margin: 4px 0;
}

.prompt-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .safari-install-prompt {
    left: 10px;
    right: 10px;
    bottom: 10px;
  }
}
</style>
