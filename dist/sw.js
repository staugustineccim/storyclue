// StoryClue Service Worker
// Network-first for HTML so new deploys are picked up immediately.
// Cache-first for hashed assets (JS/CSS/fonts) which never change content.

const CACHE_NAME = 'storyclue-v3';

// Activate: delete ALL old caches so stale JS never gets served
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Install: no pre-caching — let the fetch handler populate the cache
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  // API calls: always network-only
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // HTML pages (index.html and all SPA routes): NETWORK-FIRST
  // This ensures new deploys are loaded immediately, not after two page loads.
  const isHTML = url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    !url.pathname.includes('.');   // SPA routes have no extension

  if (isHTML) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request)) // offline fallback only
    );
    return;
  }

  // Hashed JS/CSS/image assets: cache-first (content-addressed, never stale)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
