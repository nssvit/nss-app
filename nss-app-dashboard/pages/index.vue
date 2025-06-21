<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
    <div class="mx-auto max-w-7xl py-24 sm:px-6 sm:py-32 lg:px-8">
      <div class="relative isolate overflow-hidden bg-gray-900 px-6 pt-16 shadow-2xl sm:rounded-3xl sm:px-16 md:pt-24 lg:flex lg:gap-x-20 lg:px-24 lg:pt-0">
        <svg viewBox="0 0 1024 1024" class="absolute top-1/2 left-1/2 -z-10 size-256 -translate-y-1/2 mask-[radial-gradient(closest-side,white,transparent)] sm:left-full sm:-ml-80 lg:left-1/2 lg:ml-0 lg:-translate-x-1/2 lg:translate-y-0" aria-hidden="true">
          <circle cx="512" cy="512" r="512" fill="url(#759c1415-0410-454c-8f7c-9a820de03641)" fill-opacity="0.7" />
          <defs>
            <radialGradient id="759c1415-0410-454c-8f7c-9a820de03641">
              <stop stop-color="#7775D6" />
              <stop offset="1" stop-color="#E935C1" />
            </radialGradient>
          </defs>
        </svg>
        <div class="mx-auto max-w-md text-center lg:mx-0 lg:flex-auto lg:py-32 lg:text-left">
          <h2 class="text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl">
            Boost your productivity with TaskPilot
          </h2>
          <p class="mt-6 text-lg/8 text-pretty text-gray-300">
            Your AI-powered todo list application. Install it as a PWA for the best experience.
          </p>
          <div class="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
            <NuxtLink 
              to="/pwa-status" 
              class="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-xs hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Check PWA Status
            </NuxtLink>
            <button
              v-if="showInstallPrompt && !isInstalled"
              @click="installPwa"
              class="text-sm/6 font-semibold text-white hover:text-gray-200"
            >
              Install App <span aria-hidden="true">→</span>
            </button>
          </div>
          
          <!-- PWA Status Indicators -->
          <div class="mt-8 flex flex-wrap gap-2 justify-center lg:justify-start">
            <span v-if="isPwaAvailable" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              PWA Ready
            </span>
            <span v-if="isInstalled" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Installed
            </span>
            <span v-if="offlineReady" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Offline Ready
            </span>
            <span v-if="updateAvailable" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Update Available
            </span>
          </div>
        </div>
        <div class="relative mt-16 h-80 lg:mt-8">
          <img class="absolute top-0 left-0 w-228 max-w-none rounded-md bg-white/5 ring-1 ring-white/10" src="https://tailwindcss.com/plus-assets/img/component-images/dark-project-app-screenshot.png" alt="App screenshot" width="1824" height="1080" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const { 
  isPwaAvailable, 
  isInstalled, 
  offlineReady, 
  updateAvailable,
  showInstallPrompt,
  installPwa
} = usePwa()

// Set page title
useHead({
  title: 'TaskPilot - AI-Powered Todo List',
  meta: [
    { name: 'description', content: 'Boost your productivity with TaskPilot, an AI-powered todo list application.' }
  ]
})
</script>
