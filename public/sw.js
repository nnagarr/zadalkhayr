// Service Worker for زاد الخير PWA
const CACHE_NAME = 'zadalkhayr-v4';

// Cache essential static assets and offline page
const STATIC_ASSETS = [
    '/logo/logo.png',
    '/logo/logoapp.png',
    '/logo/icon-192.png',
    '/manifest.json',
    '/offline.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    // Activate immediately
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Removing old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    // Take control immediately
    self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Only handle GET requests
    if (request.method !== 'GET') return;

    // Skip API routes and auth endpoints
    if (request.url.includes('/api/') || request.url.includes('/auth/')) {
        return;
    }

    // Navigation requests (HTML pages) -> Network first, then Offline Page
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch((error) => {
                console.log('[SW] Fetch failed; returning offline page instead.', error);
                return caches.match('/offline.html');
            })
        );
        return;
    }

    // Static assets -> Cache first, then Network
    if (request.url.includes('/logo/') || request.url.includes('/manifest.json') || request.url.includes('/offline.html')) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(request).then((response) => {
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                });
            })
        );
    }
});

// Handle skip waiting message from the app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
