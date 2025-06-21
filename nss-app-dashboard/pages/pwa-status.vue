<template>
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">PWA Status & Controls</h1>
    
    <!-- PWA Status Information -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div class="bg-white p-6 rounded-lg shadow-md border">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">PWA Status</h2>
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-gray-600">PWA Available:</span>
            <span :class="isPwaAvailable ? 'text-green-600' : 'text-red-600'">
              {{ isPwaAvailable ? 'Yes' : 'No' }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">App Installed:</span>
            <span :class="isInstalled ? 'text-green-600' : 'text-red-600'">
              {{ isInstalled ? 'Yes' : 'No' }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Service Worker Active:</span>
            <span :class="swActivated ? 'text-green-600' : 'text-red-600'">
              {{ swActivated ? 'Yes' : 'No' }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Offline Ready:</span>
            <span :class="offlineReady ? 'text-green-600' : 'text-red-600'">
              {{ offlineReady ? 'Yes' : 'No' }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Update Available:</span>
            <span :class="updateAvailable ? 'text-orange-600' : 'text-green-600'">
              {{ updateAvailable ? 'Yes' : 'No' }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Registration Error:</span>
            <span :class="registrationError ? 'text-red-600' : 'text-green-600'">
              {{ registrationError ? 'Yes' : 'No' }}
            </span>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-md border">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">PWA Controls</h2>
        <div class="space-y-3">
          <button
            v-if="showInstallPrompt && !isInstalled"
            @click="handleInstall"
            class="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
          >
            Install App
          </button>
          
          <button
            v-if="updateAvailable"
            @click="handleUpdate"
            class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Update App
          </button>
          
          <button
            @click="refreshPage"
            class="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            Refresh Page
          </button>
          
          <button
            @click="checkForUpdates"
            class="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Check for Updates
          </button>
        </div>
      </div>
    </div>

    <!-- PWA Information -->
    <div class="bg-blue-50 p-6 rounded-lg border border-blue-200">
      <h2 class="text-xl font-semibold text-blue-900 mb-4">About PWA Features</h2>
      <div class="text-blue-800 space-y-2">
        <p>• <strong>Progressive Web App (PWA)</strong> features are enabled for this application</p>
        <p>• The app can be installed on your device for a native-like experience</p>
        <p>• Works offline after the initial visit</p>
        <p>• Automatic updates with user prompts</p>
        <p>• Background sync capabilities</p>
      </div>
    </div>

    <!-- Back to Home -->
    <div class="mt-8 text-center">
      <NuxtLink 
        to="/"
        class="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
      >
        ← Back to Home
      </NuxtLink>
    </div>
  </div>
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
  updatePwa,
  getSwRegistration
} = usePwa()

const handleInstall = async () => {
  const success = await installPwa()
  if (success) {
    console.log('App installed successfully')
  }
}

const handleUpdate = async () => {
  const success = await updatePwa()
  if (success) {
    console.log('App updated successfully')
  }
}

const refreshPage = () => {
  window.location.reload()
}

const checkForUpdates = () => {
  // Force check for updates by getting SW registration
  const registration = getSwRegistration()
  if (registration) {
    registration.update().then(() => {
      console.log('Checked for updates')
    })
  }
}

// Set page title
useHead({
  title: 'PWA Status - TaskPilot'
})
</script>
