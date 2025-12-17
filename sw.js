/**
 * Service Worker
 * Handles caching and offline functionality
 */
const CACHE_NAME = 'v3.1.061';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/config.js',
    '/js/version.js',
    '/js/router.js',
    '/js/services/supabase-client.js',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
];

// Install Event
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Install');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] Caching app shell');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activate');
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
    // Navigation requests -> network first, fall back to cache
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('/index.html');
            })
        );
        return;
    }

    // For other requests, use Stale-While-Revalidate
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                const responseToCache = networkResponse.clone();
                // Update cache
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return networkResponse;
            }).catch((err) => {
                // Network failure or other fetch error
                console.warn('[ServiceWorker] Fetch failed:', err);
                // Optionally return a fallback image or offline page here
                return new Response('Network error happening', { status: 408, headers: { 'Content-Type': 'text/plain' } });
            });
            return cachedResponse || fetchPromise;
        })
    );
});
