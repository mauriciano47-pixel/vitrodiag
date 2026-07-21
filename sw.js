// VitroDiag - Service Worker (Network-First Strategy with Cache Fallback for PWA Offline)
const CACHE_NAME = 'vitrodiag-cache-v1.0.53';

const ASSETS_TO_CACHE = [
  '/',
  '/static/manifest.webmanifest',
  '/static/js/main.js',
  '/static/js/state.js',
  '/static/js/camera.js',
  '/static/js/vision.js',
  '/static/js/ui.js',
  '/static/js/db.js',
  '/static/js/ocr.js',
  '/static/js/timing.js',
  '/static/js/ai.js',
  '/static/js/log.js',
  '/static/js/swab.js',
  '/static/js/geometry.js',
  '/static/icons/icon-192.svg',
  '/static/model/model.json',
  '/static/model/weights.bin'
];

// Instalación: Precargar recursos esenciales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precargando assets en caché...');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW] Error en precarga parcial de assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activación: Limpieza de cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Eliminando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia Network-First con Fallback a Cache (Ideal para PWA Offline en Planta)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Si responde bien de red, guardamos copia actualizada en cache (excepto llamadas parciales o externas)
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Si no hay red, servimos desde la caché
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si solicita la página principal offline, retornar '/' desde cache
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});

// Listener para forzar actualización inmediata desde la app
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
