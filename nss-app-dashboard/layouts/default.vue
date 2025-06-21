<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Sidebar -->
    <DashboardSidebar @sidebar-toggle="handleSidebarToggle" />
    
    <!-- Main Content -->
    <main class="flex-1 flex flex-col header-bg">
      <!-- Top Bar -->
      <header class="flex items-center justify-between px-5 py-4 border-b border-gray-700/30 sticky top-0 z-20 header-bg h-16">
        <div class="flex items-center space-x-4 h-8">
          <div class="flex items-center space-x-3">
            <i class="fas fa-campground text-lg text-indigo-400"></i>
            <h1 class="text-lg font-semibold text-gray-100">
              NSS VIT / <span class="text-gray-400">{{ pageTitle }}</span>
            </h1>
          </div>
        </div>
        
        <div class="flex items-center space-x-3">
          <div class="relative">
            <input 
              type="text" 
              placeholder="Search events..." 
              v-model="searchQuery"
              class="input-dark text-sm rounded-lg py-2 px-3 pl-9 focus:outline-none placeholder-gray-500" 
              style="width: 220px;"
            >
            <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm"></i>
          </div>
          
          <button 
            class="button-glass-primary hover-lift flex items-center space-x-2 px-4 py-2 rounded-lg font-medium" 
            style="font-size: 0.94rem;"
            @click="openCreateModal"
          >
            <i class="fas fa-plus fa-sm"></i>
            <span>Create Event</span>
          </button>
          
          <button class="action-button hover-lift text-gray-400 hover:text-gray-200 p-2 rounded-lg">
            <i class="far fa-bell fa-sm"></i>
          </button>
        </div>
      </header>

      <!-- Page Content -->
      <div class="flex-1 overflow-x-hidden overflow-y-auto main-content-bg">
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

// Modal state
const isModalOpen = ref(false)
const editingEvent = ref(null)

// Sidebar collapse state
const sidebarCollapsed = ref(false)

const handleSidebarToggle = (collapsed) => {
  sidebarCollapsed.value = collapsed
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

// Provide search query to child components
provide('searchQuery', searchQuery)
provide('openEventModal', (event = null) => {
  editingEvent.value = event
  isModalOpen.value = true
})
</script>

<style scoped>
/* Any additional layout-specific styles */
</style>
