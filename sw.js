// VitroDiag Always-Live (Zero-SW Uninstaller & Self-Destruct Shield)
// Este script desregistra automáticamente el Service Worker y purga CacheStorage
// en cualquier cliente que lo tenga activo.

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((k) => {
                    console.log('[VitroDiag Uninstaller] Purgando caché:', k);
                    return caches.delete(k);
                })
            );
        }).then(() => {
            console.log('[VitroDiag Uninstaller] Auto-desregistrando Service Worker...');
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
