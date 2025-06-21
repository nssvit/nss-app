<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <h1 class="text-xl font-semibold text-gray-900">TaskPilot</h1>
          <nav>
            <!-- Add navigation items here -->
          </nav>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <p class="text-center text-sm text-gray-500">
          © 2025 TaskPilot. Built with Nuxt.js
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
// You can add global layout logic here
useHead({
  title: 'TaskPilot - AI-Powered Task Management',
  meta: [
    { name: 'description', content: 'Manage your tasks efficiently with AI-powered insights' }
  ]
})
</script>

<style scoped>
/* Layout styles are handled by Tailwind CSS */
</style>
