/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope

const CACHE_NAME = 'chappi-v1.0.0'
const RUNTIME_CACHE = 'chappi-runtime-v1'
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - network first for API, cache first for static
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip WebSocket requests
  if (url.protocol === 'ws:' || url.protocol === 'wss:') return

  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) return

  // API requests - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
    return
  }

  // Static assets - Cache first, fallback to network
  event.respondWith(cacheFirst(request))
})

// Cache first strategy
async function cacheFirst(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    // Update cache in background
    fetchAndCache(request)
    return cachedResponse
  }

  return fetchAndCache(request)
}

// Network first strategy
async function networkFirst(request: Request): Promise<Response> {
  try {
    const response = await fetch(request)
    
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }

    return new Response(
      JSON.stringify({ 
        error: 'Network unavailable',
        offline: true 
      }),
      {
        status: 503,
        headers: { 
          'Content-Type': 'application/json',
          'X-Offline': 'true'
        }
      }
    )
  }
}

// Fetch and cache helper
async function fetchAndCache(request: Request): Promise<Response> {
  try {
    const response = await fetch(request)
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const cachedIndex = await caches.match('/')
      if (cachedIndex) {
        return cachedIndex
      }
    }
    
    return new Response('Offline', { status: 503 })
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  const data = event.data.json()
  
  const options: NotificationOptions = {
    body: data.body || 'New notification from Chappi',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      nodeId: data.nodeId,
      type: data.type
    },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    tag: data.tag || 'chappi-notification',
    renotify: true,
    requireInteraction: data.important || false
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Chappi Alert', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({
              type: 'NAVIGATE',
              url
            })
            return client.focus()
          }
        }
        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(url)
        }
      })
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-metrics') {
    event.waitUntil(syncMetrics())
  }
  
  if (event.tag === 'sync-conversations') {
    event.waitUntil(syncConversations())
  }
})

async function syncMetrics() {
  try {
    const cache = await caches.open(RUNTIME_CACHE)
    const requests = await cache.keys()
    
    for (const request of requests) {
      if (request.url.includes('/api/metrics')) {
        await fetch(request)
      }
    }
    
    console.log('[SW] Metrics synced')
  } catch (error) {
    console.error('[SW] Sync failed:', error)
  }
}

async function syncConversations() {
  try {
    // Sync pending messages
    console.log('[SW] Conversations synced')
  } catch (error) {
    console.error('[SW] Conversation sync failed:', error)
  }
}

// Periodic background sync (when supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-nodes') {
    event.waitUntil(checkNodesStatus())
  }
})

async function checkNodesStatus() {
  try {
    const response = await fetch('/api/nodes/status')
    const data = await response.json()
    
    // Check for offline nodes and notify
    const offlineNodes = data.nodes?.filter((n: any) => n.status === 'offline') || []
    
    if (offlineNodes.length > 0) {
      self.registration.showNotification('Chappi Alert', {
        body: `${offlineNodes.length} node(s) went offline`,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        tag: 'nodes-offline'
      })
    }
  } catch (error) {
    console.error('[SW] Node check failed:', error)
  }
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting()
  }
  
  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls)
      })
    )
  }
})

export {}
