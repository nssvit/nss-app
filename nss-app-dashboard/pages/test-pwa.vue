<template>
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">PWA Test & Diagnostics</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <!-- PWA Status -->
      <div class="bg-white p-6 rounded-lg shadow-md border">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">PWA Status</h2>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between">
            <span>PWA Available:</span>
            <span :class="$pwa ? 'text-green-600' : 'text-red-600'">
              {{ $pwa ? 'Yes' : 'No' }}
            </span>
          </div>
          <div class="flex justify-between">
            <span>Service Worker:</span>
            <span :class="serviceWorkerStatus.color">
              {{ serviceWorkerStatus.text }}
            </span>
          </div>
          <div class="flex justify-between">
            <span>Registration:</span>
            <span :class="registration ? 'text-green-600' : 'text-red-600'">
              {{ registration ? 'Active' : 'None' }}
            </span>
          </div>
          <div class="flex justify-between">
            <span>Install Prompt:</span>
            <span :class="$pwa?.showInstallPrompt ? 'text-green-600' : 'text-gray-600'">
              {{ $pwa?.showInstallPrompt ? 'Available' : 'Not Available' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Test Actions -->
      <div class="bg-white p-6 rounded-lg shadow-md border">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Test Actions</h2>
        <div class="space-y-3">
          <button
            @click="testServiceWorker"
            class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Test Service Worker
          </button>
          
          <button
            @click="forceUpdate"
            class="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
          >
            Force Update Check
          </button>
          
          <button
            @click="clearCache"
            class="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Clear Cache
          </button>
          
          <button
            @click="refreshAll"
            class="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Hard Refresh
          </button>
        </div>
      </div>
    </div>

    <!-- Console Output -->
    <div class="bg-gray-50 p-6 rounded-lg border">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Console Output</h2>
      <div 
        ref="consoleOutput" 
        class="bg-black text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto"
      >
        <div v-for="(log, index) in consoleLogs" :key="index" class="mb-1">
          <span class="text-gray-500">[{{ log.time }}]</span> {{ log.message }}
        </div>
      </div>
      <button 
        @click="clearConsole"
        class="mt-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
      >
        Clear Console
      </button>
    </div>
  </div>
</template>

<script setup>
const { $pwa } = useNuxtApp()

const consoleLogs = ref([])
const registration = ref(null)
const consoleOutput = ref(null)

const serviceWorkerStatus = computed(() => {
  if (!process.client) return { text: 'Server Side', color: 'text-gray-500' }
  
  if ('serviceWorker' in navigator) {
    if ($pwa?.swActivated) {
      return { text: 'Active', color: 'text-green-600' }
    } else {
      return { text: 'Supported', color: 'text-yellow-600' }
    }
  } else {
    return { text: 'Not Supported', color: 'text-red-600' }
  }
})

const addLog = (message) => {
  const now = new Date()
  consoleLogs.value.push({
    time: now.toLocaleTimeString(),
    message
  })
  
  // Auto scroll to bottom
  nextTick(() => {
    if (consoleOutput.value) {
      consoleOutput.value.scrollTop = consoleOutput.value.scrollHeight
    }
  })
}

const testServiceWorker = async () => {
  addLog('Testing Service Worker...')
  
  if (!process.client) {
    addLog('❌ Not running on client side')
    return
  }
  
  if ('serviceWorker' in navigator) {
    addLog('✅ Service Worker API is supported')
    
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        addLog(`✅ Service Worker registered: ${registration.scope}`)
        addLog(`   - Active: ${registration.active ? 'Yes' : 'No'}`)
        addLog(`   - Installing: ${registration.installing ? 'Yes' : 'No'}`)
        addLog(`   - Waiting: ${registration.waiting ? 'Yes' : 'No'}`)
      } else {
        addLog('❌ No Service Worker registration found')
      }
    } catch (error) {
      addLog(`❌ Error checking Service Worker: ${error.message}`)
    }
  } else {
    addLog('❌ Service Worker not supported in this browser')
  }
  
  // Test PWA object
  if ($pwa) {
    addLog('✅ $pwa object is available')
    addLog(`   - SW Activated: ${$pwa.swActivated || false}`)
    addLog(`   - Offline Ready: ${$pwa.offlineReady || false}`)
    addLog(`   - Need Refresh: ${$pwa.needRefresh || false}`)
  } else {
    addLog('❌ $pwa object not available')
  }
}

const forceUpdate = async () => {
  addLog('Forcing update check...')
  
  if ($pwa?.getSWRegistration) {
    try {
      const reg = $pwa.getSWRegistration()
      if (reg) {
        await reg.update()
        addLog('✅ Update check completed')
      } else {
        addLog('❌ No registration found')
      }
    } catch (error) {
      addLog(`❌ Update failed: ${error.message}`)
    }
  } else {
    addLog('❌ getSWRegistration not available')
  }
}

const clearCache = async () => {
  addLog('Clearing cache...')
  
  if (!process.client) {
    addLog('❌ Not running on client side')
    return
  }
  
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys()
      addLog(`Found ${cacheNames.length} caches`)
      
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName)
        addLog(`✅ Deleted cache: ${cacheName}`)
      }
      
      addLog('✅ All caches cleared')
    } catch (error) {
      addLog(`❌ Failed to clear cache: ${error.message}`)
    }
  } else {
    addLog('❌ Cache API not supported')
  }
}

const refreshAll = () => {
  addLog('Performing hard refresh...')
  if (process.client) {
    window.location.reload(true)
  }
}

const clearConsole = () => {
  consoleLogs.value = []
}

// Initialize
onMounted(() => {
  addLog('PWA Test page loaded')
  addLog(`Environment: ${process.dev ? 'Development' : 'Production'}`)
  
  // Check registration periodically
  if (process.client && $pwa?.getSWRegistration) {
    registration.value = $pwa.getSWRegistration()
  }
})

// Set page title
useHead({
  title: 'PWA Test - TaskPilot'
})
</script>
