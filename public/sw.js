/**
 * Service Worker for Veo3 Video Generator
 * Implements aggressive caching strategy for optimal performance
 * Features: Static asset caching, API response caching, offline support
 */

const CACHE_VERSION = 'v1.2.0';
const STATIC_CACHE = `veo3-static-${CACHE_VERSION}`;
const API_CACHE = `veo3-api-${CACHE_VERSION}`;
const VIDEO_CACHE = `veo3-videos-${CACHE_VERSION}`;

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/robots.txt',
  '/sitemap.xml',
];

// API endpoints that can be cached
const CACHEABLE_APIS = [
  '/api/auth/user',
  '/api/user/profile',
  '/api/templates',
  '/api/scene-templates',
  '/api/user/videos', // Cache for offline viewing
];

// API endpoints that should never be cached
const NEVER_CACHE_APIS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/videos/generate', // Never cache generation requests
  '/api/videos/upload',
];

/**
 * Install event - cache critical assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      // Take control immediately
      return self.skipWaiting();
    })
  );
});

/**
 * Activate event - clean old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('veo3-') && !cacheName.includes(CACHE_VERSION)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients
      return self.clients.claim();
    })
  );
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests (except for known CDNs)
  if (url.origin !== self.location.origin && !isTrustedDomain(url.origin)) {
    return;
  }
  
  // Handle different types of requests
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(url.pathname)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isVideoAsset(url.pathname)) {
    event.respondWith(handleVideoAsset(request));
  } else {
    event.respondWith(handleGenericRequest(request));
  }
});

/**
 * Handle static assets (CSS, JS, images)
 * Strategy: Cache First with fallback to network
 */
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    console.log('[SW] Serving cached static asset:', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      console.log('[SW] Caching static asset:', request.url);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch static asset:', request.url, error);
    
    // Return offline fallback for critical assets
    if (request.url.includes('.html')) {
      return cache.match('/index.html');
    }
    
    throw error;
  }
}

/**
 * Handle API requests
 * Strategy: Network First with cache fallback for specific endpoints
 */
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Never cache authentication or generation requests
  if (NEVER_CACHE_APIS.some(api => pathname.includes(api))) {
    console.log('[SW] Bypassing cache for:', pathname);
    return fetch(request);
  }
  
  const cache = await caches.open(API_CACHE);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses for cacheable endpoints
      if (CACHEABLE_APIS.some(api => pathname.includes(api))) {
        console.log('[SW] Caching API response:', pathname);
        cache.put(request, networkResponse.clone());
      }
      
      return networkResponse;
    }
    
    throw new Error(`HTTP ${networkResponse.status}`);
    
  } catch (error) {
    console.log('[SW] Network failed, trying cache for:', pathname);
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving cached API response:', pathname);
      
      // Add cache headers to indicate stale data
      const response = cachedResponse.clone();
      response.headers.set('X-Served-By', 'ServiceWorker');
      response.headers.set('X-Cache-Status', 'STALE');
      
      return response;
    }
    
    // Return offline response for critical endpoints
    if (pathname.includes('/api/user')) {
      return new Response(
        JSON.stringify({ error: 'Offline', message: 'This data is not available offline' }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}

/**
 * Handle video assets
 * Strategy: Cache with size limits
 */
async function handleVideoAsset(request) {
  const cache = await caches.open(VIDEO_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    console.log('[SW] Serving cached video:', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Only cache small videos (< 10MB) to avoid storage issues
      const contentLength = networkResponse.headers.get('content-length');
      const fileSize = contentLength ? parseInt(contentLength) : 0;
      
      if (fileSize < 10 * 1024 * 1024) { // 10MB limit
        console.log('[SW] Caching video asset:', request.url);
        cache.put(request, networkResponse.clone());
      } else {
        console.log('[SW] Video too large to cache:', request.url, fileSize);
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch video:', request.url, error);
    throw error;
  }
}

/**
 * Handle generic requests
 * Strategy: Network First
 */
async function handleGenericRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Fallback to cache for navigation requests
    if (request.mode === 'navigate') {
      const cache = await caches.open(STATIC_CACHE);
      return cache.match('/index.html');
    }
    
    throw error;
  }
}

/**
 * Utility functions
 */
function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)$/.test(pathname) || 
         pathname === '/' || pathname === '/index.html';
}

function isAPIRequest(pathname) {
  return pathname.startsWith('/api/');
}

function isVideoAsset(pathname) {
  return /\.(mp4|webm|ogg|mov)$/.test(pathname) || pathname.includes('video');
}

function isTrustedDomain(origin) {
  const trustedDomains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://cdn.jsdelivr.net',
    'https://unpkg.com',
  ];
  
  return trustedDomains.includes(origin);
}

/**
 * Background sync for failed API requests
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'retry-api-requests') {
    event.waitUntil(retryFailedRequests());
  }
});

async function retryFailedRequests() {
  // Implementation for retrying failed API requests when back online
  console.log('[SW] Retrying failed requests...');
}

/**
 * Push notification handling (for future features)
 */
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: 'veo3-notification',
      })
    );
  }
});

/**
 * Notification click handling
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.openWindow('/')
  );
});

console.log('[SW] Service worker loaded successfully');