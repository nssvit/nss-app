const CACHE_NAME = 'pwa-next-app-v1'
const STATIC_CACHE_NAME = 'pwa-static-v1'
const DYNAMIC_CACHE_NAME = 'pwa-dynamic-v1'
const RUNTIME_CACHE_NAME = 'pwa-runtime-v1'

const staticAssets = [
  '/',
  '/offline',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-192x192.svg',
  '/icon-512x512.svg',
  '/manifest.json'
]

const runtimeCaching = [
  '/_next/static/',
  '/_next/image',
  '/images/',
  '/fonts/',
  '/api/'
]

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
}

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing')
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(staticAssets)
      })
      .then(() => {
        console.log('Service Worker: Installation complete')
      })
      .catch((error) => {
        console.error('Service Worker: Cache installation failed:', error)
      })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (![STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME, RUNTIME_CACHE_NAME].includes(cacheName)) {
            console.log('Service Worker: Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('Service Worker: Activation complete')
    })
  )
  self.clients.claim()
})

// Fetch event - cache strategy
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests and non-GET requests
  if (!event.request.url.startsWith(self.location.origin) || event.request.method !== 'GET') {
    return
  }

  const requestUrl = new URL(event.request.url)
  
  // Different strategies for different types of requests
  if (event.request.destination === 'document') {
    // Network first for HTML documents
    event.respondWith(handleDocumentRequest(event.request))
  } else if (event.request.url.includes('/_next/') || 
             event.request.url.includes('/static/') ||
             event.request.url.includes('/icons/') ||
             requestUrl.pathname.match(/\.(js|css|woff2?|ttf|eot)$/)) {
    // Cache first for static assets
    event.respondWith(handleStaticAssets(event.request))
  } else if (requestUrl.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/)) {
    // Stale while revalidate for images
    event.respondWith(handleImages(event.request))
  } else if (event.request.url.includes('/api/')) {
    // Network first for API calls with fallback
    event.respondWith(handleApiRequest(event.request))
  } else {
    // Default strategy
    event.respondWith(handleDefault(event.request))
  }
})

// Handle document requests (Network first)
async function handleDocumentRequest(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
  } catch (error) {
    console.log('Network failed for document, serving from cache or offline page')
  }
  
  // Try cache or offline page
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  return caches.match('/offline')
}

// Handle static assets (Cache first)
async function handleStaticAssets(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
  } catch (error) {
    console.log('Failed to fetch static asset:', request.url)
  }
  
  return new Response('Asset not available offline', { status: 503 })
}

// Handle images with stale-while-revalidate strategy
async function handleImages(request) {
  const cache = await caches.open(RUNTIME_CACHE_NAME)
  const cachedResponse = await cache.match(request)
  
  // Return cached version immediately if available
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then(response => {
      if (response && response.status === 200) {
        cache.put(request, response.clone())
      }
    }).catch(() => {
      // Ignore network errors for background updates
    })
    return cachedResponse
  }
  
  // If not cached, try network and cache the result
  try {
    const networkResponse = await fetch(request)
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
  } catch (error) {
    console.log('Failed to fetch image:', request.url)
  }
  
  return new Response('Image not available offline', { status: 503 })
}

// Handle API requests with network first strategy
async function handleApiRequest(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse && networkResponse.status === 200) {
      // Only cache GET requests for APIs
      if (request.method === 'GET') {
        const cache = await caches.open(DYNAMIC_CACHE_NAME)
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    }
  } catch (error) {
    console.log('API request failed, trying cache:', request.url)
  }
  
  // Try cache as fallback
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  return new Response(JSON.stringify({ 
    error: 'API not available offline',
    message: 'This feature requires an internet connection'
  }), { 
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  })
}

// Default handler
async function handleDefault(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
  } catch (error) {
    console.log('Network request failed:', request.url)
  }
  
  return new Response('Content not available offline', { 
    status: 503,
    headers: { 'Content-Type': 'text/plain' }
  })
}

// Push notification event
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '1',
      },
              actions: [
          {
            action: 'explore',
            title: 'Explore this new world',
            icon: '/icon-192x192.png',
          },
          {
            action: 'close',
            title: 'Close',
            icon: '/icon-192x192.png',
          },
        ],
    }
    event.waitUntil(self.registration.showNotification(data.title, options))
  }
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received.')
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/'))
  } else if (event.action === 'close') {
    event.notification.close()
  } else {
    event.waitUntil(clients.openWindow('/'))
  }
}) 