<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Sidebar -->
    <DashboardSidebar 
      @sidebar-toggle="handleSidebarToggle" 
      @mobile-toggle="handleMobileToggle"
      ref="sidebarRef"
    />
    
    <!-- Main Content -->
    <main 
      class="flex-1 flex flex-col header-bg"
      :class="{ 'lg:ml-0': isMobile }"
    >
      <!-- Top Bar - PWA Enhanced -->
      <header class="flex items-center justify-between px-2 sm:px-5 py-1 sm:py-2.5 border-b border-gray-700/30 sticky top-0 z-20 header-bg min-h-[48px] sm:h-13">
        <div class="flex items-center space-x-1 sm:space-x-3 h-9 sm:h-10">
          <!-- Mobile Menu Button - 44px touch target -->
          <button 
            v-if="isMobile"
            @click="toggleMobileSidebar"
            class="sidebar-toggle text-gray-400 hover:text-gray-200 h-7 w-7 sm:h-9 sm:w-9 lg:hidden flex items-center justify-center rounded-lg"
          >
            <i class="fas fa-bars text-xs sm:text-sm"></i>
          </button>
          
          <div class="flex items-center space-x-1 sm:space-x-3">
            <i class="fas fa-campground text-sm sm:text-lg text-indigo-400"></i>
            <h1 class="font-semibold text-gray-100 leading-5 sm:leading-6" style="font-size: calc(0.875rem * 1.02); line-height: calc(1.25rem * 1.02);">
              <span class="hidden sm:inline text-gray-300" style="font-size: calc(1.125rem * 1.02); line-height: calc(1.5rem * 1.02);">NSS VIT /</span>
              <span class="text-indigo-300 ml-0.5 sm:ml-1 font-bold" style="font-size: calc(1.125rem * 1.02); line-height: calc(1.5rem * 1.02);">{{ pageTitle }}</span>
            </h1>
          </div>
        </div>
        
        <div class="flex items-center navbar-buttons-container">
          <!-- Search - Hidden on small mobile, visible on larger screens -->
          <div class="relative hidden sm:block">
            <input 
              type="text" 
              placeholder="Search events..." 
              v-model="searchQuery"
              class="input-dark text-sm rounded-lg focus:outline-none placeholder-gray-500 navbar-search-input" 
              :style="{ width: isMobile ? '150px' : '175px' }"
            >
            <i class="fas fa-search absolute text-gray-500 text-xs navbar-search-icon"></i>
          </div>
          
          <!-- Mobile Search Toggle - touch target -->
          <button 
            v-if="isMobile"
            @click="toggleMobileSearch"
            class="action-button hover-lift text-gray-400 hover:text-gray-200 rounded-md sm:hidden flex items-center justify-center navbar-mobile-search-btn"
          >
            <i class="fas fa-search text-xs"></i>
          </button>
          
          <!-- Create Event Button - PWA Enhanced touch target -->
          <button 
            class="button-glass-primary hover-lift flex items-center rounded-md sm:rounded-lg font-medium text-xs sm:text-sm navbar-create-btn" 
            @click="openCreateModal"
          >
            <i class="fas fa-plus text-xs"></i>
            <span class="hidden sm:inline">Create Event</span>
            <span class="sm:hidden text-xs">Create</span>
          </button>
          
          <!-- Notification Button - touch target -->
          <button class="action-button hover-lift text-gray-400 hover:text-gray-200 rounded-md sm:rounded-lg flex items-center justify-center navbar-notification-btn">
            <i class="far fa-bell text-xs"></i>
          </button>
        </div>
      </header>

      <!-- Mobile Search Bar - PWA Enhanced -->
      <div 
        v-if="showMobileSearch && isMobile"
        class="px-2 py-1.5 border-b border-gray-700/30 bg-slate-900/50 sm:hidden"
      >
        <div class="relative">
          <input 
            type="text" 
            placeholder="Search events..." 
            v-model="searchQuery"
            class="input-dark text-sm rounded-md py-2 px-3 pl-9 pr-10 w-full focus:outline-none placeholder-gray-500 h-8"
            ref="mobileSearchInput"
          >
          <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs"></i>
          <button 
            @click="toggleMobileSearch"
            class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 h-5 w-5 flex items-center justify-center rounded"
          >
            <i class="fas fa-times text-xs"></i>
          </button>
        </div>
      </div>

      <!-- Page Content -->
      <div class="flex-1 overflow-x-hidden overflow-y-auto main-content-bg pwa-optimized">
        <slot />
      </div>
    </main>
    
    <!-- Event Modal -->
    <EventModal 
      :is-open="isModalOpen"
      :event="editingEvent"
      @close="closeModal"
      @save="handleSaveEvent"
    />
    
    <!-- PWA Install Prompt -->
    <PwaInstallPrompt />
    
    <!-- PWA Status Indicator -->
    <PwaStatus />
  </div>
</template>

<script setup>
// Page title computed based on route
const route = useRoute()
const pageTitle = computed(() => {
  const titles = {
    '/': 'Events',
    '/dashboard': 'Dashboard',
    '/volunteers': 'Volunteers',
    '/attendance': 'Attendance',
    '/reports': 'Reports',
    '/user-management': 'User Management',
    '/settings': 'Settings',
    '/profile': 'Profile'
  }
  return titles[route.path] || 'Dashboard'
})

// Search functionality
const searchQuery = ref('')
const showMobileSearch = ref(false)

// Modal state
const isModalOpen = ref(false)
const editingEvent = ref(null)

// Sidebar states
const sidebarCollapsed = ref(false)
const isMobileOpen = ref(false)
const isMobile = ref(false)

// Refs
const sidebarRef = ref(null)
const mobileSearchInput = ref(null)

// Check if device is mobile
const checkMobile = () => {
  if (process.client) {
    isMobile.value = window.innerWidth <= 1024
  }
}

// Handle window resize
const handleResize = () => {
  checkMobile()
  if (!isMobile.value) {
    showMobileSearch.value = false
    isMobileOpen.value = false
  }
}

const handleSidebarToggle = (collapsed) => {
  sidebarCollapsed.value = collapsed
}

const handleMobileToggle = (isOpen) => {
  isMobileOpen.value = isOpen
}

const toggleMobileSidebar = () => {
  if (sidebarRef.value) {
    sidebarRef.value.toggleSidebar()
  }
}

const toggleMobileSearch = () => {
  showMobileSearch.value = !showMobileSearch.value
  if (showMobileSearch.value) {
    nextTick(() => {
      mobileSearchInput.value?.focus()
    })
  }
}

const openCreateModal = () => {
  editingEvent.value = null
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  editingEvent.value = null
}

const handleSaveEvent = (eventData) => {
  // This will be handled by individual pages
  console.log('Event saved:', eventData)
  // You can emit this to a store or parent component
}

// Initialize on mount
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', handleResize)
})

// Cleanup on unmount
onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('resize', handleResize)
  }
})

// Provide reactive values to child components
provide('searchQuery', searchQuery)
provide('isMobile', readonly(isMobile))
provide('openEventModal', (event = null) => {
  editingEvent.value = event
  isModalOpen.value = true
})
</script>

<style scoped>
/* Any additional layout-specific styles */
.w-280 {
  width: 280px;
}
</style>
