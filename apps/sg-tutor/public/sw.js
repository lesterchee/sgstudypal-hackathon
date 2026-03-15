// Purpose: Basic service worker for PWA installability.
// Caches the app shell for offline-first experience.

const CACHE_NAME = "sg-tutor-v1";
const STATIC_ASSETS = ["/", "/dashboard", "/login"];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    // Purpose: Network-first strategy for API routes, cache-first for static assets.
    if (event.request.url.includes("/api/")) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
});
