<template>
  <!-- Mobile Overlay -->
  <div 
    v-if="isMobileOpen && isMobile"
    class="mobile-overlay"
    :class="{ 'active': isMobileOpen }"
    @click="closeMobileSidebar"
  ></div>

  <aside 
    class="sidebar sidebar-bg flex-shrink-0 flex flex-col" 
    :class="{ 
      'collapsed': isCollapsed && !isMobile,
      'mobile-open': isMobileOpen && isMobile,
      'w-56': !isMobile,
      'w-280': isMobile
    }"
    id="sidebar"
  >
    <!-- Sidebar Header with Toggle - PWA Enhanced -->
    <div class="sidebar-header-box flex items-center justify-between px-3 py-2 min-h-[48px] mx-2 my-1">
      <div class="branding-section flex items-center space-x-2 h-7">
        <img 
          src="https://res.cloudinary.com/du6zyqqyw/image/upload/f_auto,q_auto,w_36/v1740557668/img/nss-logo.png" 
          alt="NSS Logo" 
          class="h-5" 
          style="transform: scale(1.01);"
        >
        <img 
          src="https://res.cloudinary.com/du6zyqqyw/image/upload/f_auto,q_auto,w_90/v1740557668/img/vit-logo.png" 
          alt="VIT Logo" 
          class="h-3.5 opacity-85" 
          style="transform: scale(1.5);"
        >
      </div>
      <!-- 44px touch target for toggle button -->
      <button 
        class="sidebar-toggle text-gray-400 hover:text-gray-200 h-10 w-10 flex items-center justify-center rounded-lg" 
        @click="toggleSidebar"
      >
        <i class="fas text-sm" :class="isMobile ? 'fa-times' : 'fa-bars'"></i>
      </button>
    </div>

    <!-- Navigation Section - PWA Enhanced -->
    <div class="flex-grow flex flex-col px-3 space-y-1">
      <!-- Navigation Links - 44px touch targets -->
      <nav class="flex-grow overflow-y-auto pr-1 space-y-1" style="font-size: 0.85rem;">
        <NuxtLink 
          to="/dashboard" 
          class="sidebar-link flex items-center space-x-3 px-3 py-2.5 text-gray-400 rounded-lg min-h-[44px]" 
          title="Dashboard"
          :class="{ 'active-sidebar-link': $route.path === '/dashboard' }"
          @click="handleLinkClick"
        >
          <i class="fas fa-border-all w-4 text-center text-gray-500 text-sm"></i>
          <span class="sidebar-text">Dashboard</span>
        </NuxtLink>
        
        <NuxtLink 
          to="/" 
          class="sidebar-link flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium min-h-[44px]" 
          title="Events"
          :class="{ 'active-sidebar-link': $route.path === '/' }"
          @click="handleLinkClick"
        >
          <i class="fas fa-calendar-check w-4 text-center text-sm"></i>
          <span class="sidebar-text">Events</span>
        </NuxtLink>
        
        <NuxtLink 
          to="/volunteers" 
          class="sidebar-link flex items-center space-x-3 px-3 py-2.5 text-gray-400 rounded-lg min-h-[44px]" 
          title="Volunteers"
          :class="{ 'active-sidebar-link': $route.path === '/volunteers' }"
          @click="handleLinkClick"
        >
          <i class="fas fa-users w-4 text-center text-gray-500 text-sm"></i>
          <span class="sidebar-text">Volunteers</span>
        </NuxtLink>
        
        <NuxtLink 
          to="/attendance" 
          class="sidebar-link flex items-center space-x-3 px-3 py-2.5 text-gray-400 rounded-lg min-h-[44px]" 
          title="Attendance"
          :class="{ 'active-sidebar-link': $route.path === '/attendance' }"
          @click="handleLinkClick"
        >
          <i class="fas fa-user-check w-4 text-center text-gray-500 text-sm"></i>
          <span class="sidebar-text">Attendance</span>
        </NuxtLink>
        
        <NuxtLink 
          to="/reports" 
          class="sidebar-link flex items-center space-x-3 px-3 py-2.5 text-gray-400 rounded-lg min-h-[44px]" 
          title="Reports"
          :class="{ 'active-sidebar-link': $route.path === '/reports' }"
          @click="handleLinkClick"
        >
          <i class="fas fa-chart-pie w-4 text-center text-gray-500 text-sm"></i>
          <span class="sidebar-text">Reports</span>
        </NuxtLink>

        <hr class="border-gray-700/30 my-3 sidebar-text">

        <NuxtLink 
          to="/user-management" 
          class="sidebar-link flex items-center space-x-3 px-3 py-2.5 text-gray-400 rounded-lg min-h-[44px]" 
          title="User Management"
          :class="{ 'active-sidebar-link': $route.path === '/user-management' }"
          @click="handleLinkClick"
        >
          <i class="fas fa-user-shield w-4 text-center text-gray-500 text-sm"></i>
          <span class="sidebar-text">User Management</span>
        </NuxtLink>
        
        <NuxtLink 
          to="/settings" 
          class="sidebar-link flex items-center space-x-3 px-3 py-2.5 text-gray-400 rounded-lg min-h-[44px]" 
          title="Settings"
          :class="{ 'active-sidebar-link': $route.path === '/settings' }"
          @click="handleLinkClick"
        >
          <i class="fas fa-cog w-4 text-center text-gray-500 text-sm"></i>
          <span class="sidebar-text">Settings</span>
        </NuxtLink>
      </nav>

      <!-- User Profile & Logout - PWA Enhanced -->
      <div class="mt-auto pt-3 border-t border-gray-700/30">
        <NuxtLink 
          to="/profile" 
          class="sidebar-link flex items-center space-x-3 px-3 py-2.5 text-gray-300 rounded-lg min-h-[44px]" 
          title="Profile"
          @click="handleLinkClick"
        >
          <div class="relative">
            <img 
              src="https://res.cloudinary.com/du6zyqqyw/image/upload/f_auto,q_auto,w_32/v1740560606/img/2024-2025/team/rakshaksood.jpg" 
              alt="User Avatar" 
              class="w-7 h-7 rounded-full"
            >
            <span class="avatar-status-dot-sidebar bg-green-500"></span>
          </div>
          <div class="flex flex-col text-xs sidebar-text">
            <span class="font-medium text-gray-200">Prof. Rakshak S.</span>
            <span class="text-gray-500 text-xs">Admin</span>
          </div>
        </NuxtLink>
        
        <!-- 44px touch target for logout button -->
        <button 
          class="w-full flex items-center space-x-3 px-3 py-2.5 text-xs text-gray-400 hover:bg-red-900/30 hover:text-red-300 rounded-lg mt-2 transition-all duration-200 min-h-[44px]" 
          title="Logout"
          @click="logout"
        >
          <i class="fas fa-sign-out-alt w-4 text-center text-sm"></i>
          <span class="sidebar-text">Logout</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
const isCollapsed = ref(false)
const isMobileOpen = ref(false)
const isMobile = ref(false)

// Check if device is mobile
const checkMobile = () => {
  if (process.client) {
    isMobile.value = window.innerWidth <= 1024
  }
}

// Handle window resize
const handleResize = () => {
  checkMobile()
  if (!isMobile.value && isMobileOpen.value) {
    isMobileOpen.value = false
  }
}

// Toggle sidebar behavior based on device
const toggleSidebar = () => {
  if (isMobile.value) {
    isMobileOpen.value = !isMobileOpen.value
  } else {
    isCollapsed.value = !isCollapsed.value
  }
}

// Close mobile sidebar
const closeMobileSidebar = () => {
  if (isMobile.value) {
    isMobileOpen.value = false
  }
}

// Handle navigation link clicks on mobile
const handleLinkClick = () => {
  if (isMobile.value) {
    isMobileOpen.value = false
  }
}

const logout = () => {
  // Handle logout logic here
  console.log('Logout clicked')
  if (isMobile.value) {
    isMobileOpen.value = false
  }
}

// Emit collapse state for parent components
const emit = defineEmits(['sidebar-toggle', 'mobile-toggle'])

watch(isCollapsed, (newValue) => {
  emit('sidebar-toggle', newValue)
})

watch(isMobileOpen, (newValue) => {
  emit('mobile-toggle', newValue)
})

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

// Expose methods for parent components
defineExpose({
  toggleSidebar,
  closeMobileSidebar,
  isMobile: readonly(isMobile),
  isMobileOpen: readonly(isMobileOpen)
})
</script>

 