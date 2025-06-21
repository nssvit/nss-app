<template>
  <div id="app">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
// PWA-optimized metadata and configuration
useHead({
  title: 'NSS VIT Dashboard',
  meta: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
    },
    {
      name: 'description',
      content: 'NSS VIT Dashboard - Manage events, volunteers, and activities with our mobile-first PWA'
    },
    {
      name: 'theme-color',
      content: '#6366F1'
    },
    {
      name: 'apple-mobile-web-app-capable',
      content: 'yes'
    },
    {
      name: 'apple-mobile-web-app-status-bar-style',
      content: 'black-translucent'
    },
    {
      name: 'apple-mobile-web-app-title',
      content: 'NSS VIT'
    },
    {
      name: 'application-name',
      content: 'NSS VIT Dashboard'
    },
    {
      name: 'mobile-web-app-capable',
      content: 'yes'
    },
    {
      name: 'format-detection',
      content: 'telephone=no'
    }
  ],
  link: [
    {
      rel: 'apple-touch-icon',
      href: '/icon-192x192.png'
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      href: '/favicon-32x32.png'
    },
    {
      rel: 'icon',
      type: 'image/png', 
      sizes: '16x16',
      href: '/favicon-16x16.png'
    },
    {
      rel: 'manifest',
      href: '/manifest.json'
    }
  ]
})
</script>

<style>
/* Global responsive styles */
html, body {
  overflow-x: hidden;
}

#app {
  min-height: 100vh;
  width: 100%;
}

/* Prevent text selection on touch devices */
@media (hover: none) and (pointer: coarse) {
  button, .sidebar-link, .action-button {
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
}

/* Safe area insets for mobile devices */
@supports (padding-top: env(safe-area-inset-top)) {
  body {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }
}
</style>
