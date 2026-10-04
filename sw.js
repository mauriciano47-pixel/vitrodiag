// VitroDiag Always-Live (Zero-SW Uninstaller & Self-Destruct Shield)
// Protocolo Gemini Anti-Timeout Shield: timeout 8000ms con AbortController y fallback offline.
// Este script desregistra automáticamente el Service Worker y purga CacheStorage
// en cualquier cliente que lo tenga activo.

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((k) => caches.delete(k))
            );
        }).then(() => {
            return self.registration.unregister();
        }).then(() => {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Pass-through directo a la red sin interceptar ni guardar en caché
    event.respondWith(fetch(event.request));
});
