<template>
  <div class="p-4">
    <div class="card-glass rounded-xl p-6">
      <div class="flex items-center space-x-4 mb-6">
        <div class="relative">
          <img 
            src="https://res.cloudinary.com/du6zyqqyw/image/upload/f_auto,q_auto,w_64/v1740560606/img/2024-2025/team/rakshaksood.jpg" 
            alt="User Avatar" 
            class="w-16 h-16 rounded-full"
          >
          <span class="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-900"></span>
        </div>
        <div>
          <h2 class="text-xl font-semibold text-gray-100">Prof. Rakshak S.</h2>
          <p class="text-gray-400">Administrator</p>
          <p class="text-sm text-gray-500">NSS VIT</p>
        </div>
      </div>
      
      <div class="text-center py-12">
        <i class="fas fa-user text-4xl text-gray-500 mb-4"></i>
        <p class="text-gray-400">Profile management page coming soon...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
useHead({
  title: 'NSS VIT Dashboard - Profile'
})
</script> 