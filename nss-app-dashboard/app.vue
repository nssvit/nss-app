<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
useHead({
  title: 'NSS VIT Dashboard',
  meta: [
    { name: 'description', content: 'NSS VIT Dashboard for managing events, volunteers, and activities' }
  ]
})
</script>
