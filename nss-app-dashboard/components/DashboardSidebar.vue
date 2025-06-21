<template>
  <aside 
    class="sidebar sidebar-bg w-56 flex-shrink-0 flex flex-col" 
    :class="{ 'collapsed': isCollapsed }"
    id="sidebar"
  >
    <!-- Sidebar Header with Toggle -->
    <div class="sidebar-header-box flex items-center justify-between px-3 py-2 h-12 mx-3 my-2">
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
      <button 
        class="sidebar-toggle text-gray-400 hover:text-gray-200 h-7 w-7" 
        @click="toggleSidebar"
      >
        <i class="fas fa-bars text-sm"></i>
      </button>
    </div>

    <!-- Navigation Section -->
    <div class="flex-grow flex flex-col px-3 space-y-1">
      <!-- Navigation Links -->
      <nav class="flex-grow overflow-y-auto pr-1 space-y-1" style="font-size: 0.84rem;">
        <NuxtLink 
          to="/dashboard" 
          class="sidebar-link flex items-center space-x-3 px-3 py-2.5 text-gray-400 rounded-lg" 
          title="Dashboard"
          :class="{ 'active-sidebar-link': $route.path === '/dashboard' }"
        >
          <i class="fas fa-border-all w-4 text-center text-gray-500"></i>
          <span class="sidebar-text">Dashboard</span>
        </NuxtLink>
        
        <NuxtLink 
          to="/" 
          class="sidebar-link flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium" 
          title="Events"
          :class="{ 'active-sidebar-link': $route.path === '/' }"
        >
          <i class="fas fa-calendar-check w-4 text-center"></i>
          <span class="sidebar-text">Events</span>
        </NuxtLink>
        
        <NuxtLink 
          to="/volunteers" 
          class="sidebar-link flex items-center space-x-3 px-3 py-2.5 text-gray-400 rounded-lg" 
          title="Volunteers"
          :class="{ 'active-sidebar-link': $route.path === '/volunteers' }"
        >
          <i class="fas fa-users w-4 text-center text-gray-500"></i>
          <span class="sidebar-text">Volunteers</span>
        </NuxtLink>
        
        <NuxtLink 
          to="/attendance" 
          class="sidebar-link flex items-center space-x-3 px-3 py-2.5 text-gray-400 rounded-lg" 
          title="Attendance"
          :class="{ 'active-sidebar-link': $route.path === '/attendance' }"
        >
          <i class="fas fa-user-check w-4 text-center text-gray-500"></i>
          <span class="sidebar-text">Attendance</span>
        </NuxtLink>
        
        <NuxtLink 
          to="/reports" 
          class="sidebar-link flex items-center space-x-3 px-3 py-2.5 text-gray-400 rounded-lg" 
          title="Reports"
          :class="{ 'active-sidebar-link': $route.path === '/reports' }"
        >
          <i class="fas fa-chart-pie w-4 text-center text-gray-500"></i>
          <span class="sidebar-text">Reports</span>
        </NuxtLink>

        <hr class="border-gray-700/30 my-3 sidebar-text">

        <NuxtLink 
          to="/user-management" 
          class="sidebar-link flex items-center space-x-3 px-3 py-2.5 text-gray-400 rounded-lg" 
          title="User Management"
          :class="{ 'active-sidebar-link': $route.path === '/user-management' }"
        >
          <i class="fas fa-user-shield w-4 text-center text-gray-500"></i>
          <span class="sidebar-text">User Management</span>
        </NuxtLink>
        
        <NuxtLink 
          to="/settings" 
          class="sidebar-link flex items-center space-x-3 px-3 py-2.5 text-gray-400 rounded-lg" 
          title="Settings"
          :class="{ 'active-sidebar-link': $route.path === '/settings' }"
        >
          <i class="fas fa-cog w-4 text-center text-gray-500"></i>
          <span class="sidebar-text">Settings</span>
        </NuxtLink>
      </nav>

      <!-- User Profile & Logout -->
      <div class="mt-auto pt-3 border-t border-gray-700/30">
        <NuxtLink 
          to="/profile" 
          class="sidebar-link flex items-center space-x-3 px-3 py-2 text-gray-300 rounded-lg" 
          title="Profile"
        >
          <div class="relative">
            <img 
              src="https://res.cloudinary.com/du6zyqqyw/image/upload/f_auto,q_auto,w_32/v1740560606/img/2024-2025/team/rakshaksood.jpg" 
              alt="User Avatar" 
              class="w-7 h-7 rounded-full"
            >
            <span class="avatar-status-dot-sidebar bg-green-500"></span>
          </div>
          <div class="flex flex-col text-[0.7rem] sidebar-text">
            <span class="font-medium text-gray-200">Prof. Rakshak S.</span>
            <span class="text-gray-500">Admin</span>
          </div>
        </NuxtLink>
        
        <button 
          class="w-full flex items-center space-x-3 px-3 py-2.5 text-xs text-gray-400 hover:bg-red-900/30 hover:text-red-300 rounded-lg mt-2 transition-all duration-200" 
          title="Logout"
          @click="logout"
        >
          <i class="fas fa-sign-out-alt w-4 text-center"></i>
          <span class="sidebar-text">Logout</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
const isCollapsed = ref(false)

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

const logout = () => {
  // Handle logout logic here
  console.log('Logout clicked')
}

// Emit collapse state for parent components
const emit = defineEmits(['sidebar-toggle'])

watch(isCollapsed, (newValue) => {
  emit('sidebar-toggle', newValue)
})
</script>

 