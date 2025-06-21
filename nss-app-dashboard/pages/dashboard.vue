<template>
  <div class="p-4">
    <div class="card-glass rounded-xl p-6">
      <h2 class="text-xl font-semibold text-gray-100 mb-4">Dashboard</h2>
      <p class="text-gray-400">
        Welcome to the NSS VIT Dashboard. This page will contain overview statistics and quick actions.
      </p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div class="card-glass p-4 rounded-lg">
          <h3 class="text-sm font-medium text-gray-300">Total Events</h3>
          <p class="text-2xl font-bold text-gray-100 mt-2">42</p>
        </div>
        
        <div class="card-glass p-4 rounded-lg">
          <h3 class="text-sm font-medium text-gray-300">Active Volunteers</h3>
          <p class="text-2xl font-bold text-gray-100 mt-2">156</p>
        </div>
        
        <div class="card-glass p-4 rounded-lg">
          <h3 class="text-sm font-medium text-gray-300">Total Hours</h3>
          <p class="text-2xl font-bold text-gray-100 mt-2">2,340</p>
        </div>
        
        <div class="card-glass p-4 rounded-lg">
          <h3 class="text-sm font-medium text-gray-300">Upcoming Events</h3>
          <p class="text-2xl font-bold text-gray-100 mt-2">8</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
useHead({
  title: 'NSS VIT Dashboard - Overview'
})
</script> 