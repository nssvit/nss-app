// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  experimental: {
    payloadExtraction: false,
    appManifest: false
  },
  ssr: true,
  nitro: {
    experimental: {
      wasm: false
    }
  },
  app: {
    head: {
      meta: [
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'TaskPilot' },
        { name: 'format-detection', content: 'telephone=no' }
      ],
      link: [
        { rel: 'apple-touch-icon', href: '/icon-192x192.png' }
      ]
    }
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/ui',
    '@vite-pwa/nuxt'
  ],
  pwa: {
    registerType: 'autoUpdate',
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      navigateFallback: '/',
      cleanupOutdatedCaches: true,
      skipWaiting: true,
      clientsClaim: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
            }
          }
        }
      ]
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 20,
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallback: '/',
      disableRuntimeConfig: false,
      type: 'module'
    },
    manifest: {
      name: 'TaskPilot - AI Todo List',
      short_name: 'TaskPilot',
      description: 'An AI-powered todo list application that helps you manage tasks efficiently',
      theme_color: '#3b82f6',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'any',
      scope: '/',
      start_url: '/',
      id: 'taskpilot-ai-todo',
      categories: ['productivity', 'utilities'],
      lang: 'en',
      dir: 'ltr',
      prefer_related_applications: false,
      icons: [
        {
          src: 'icon-72x72.png',
          sizes: '72x72',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: 'icon-96x96.png',
          sizes: '96x96',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: 'icon-128x128.png',
          sizes: '128x128',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: 'icon-144x144.png',
          sizes: '144x144',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: 'icon-152x152.png',
          sizes: '152x152',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: 'icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: 'icon-384x384.png',
          sizes: '384x384',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: 'icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: 'icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable'
        },
        {
          src: 'icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    }
  }
})