// VitroDiag - Service Worker (Network-First Strategy with Cache Fallback for PWA Offline)
const CACHE_NAME = 'vitrodiag-cache-v1.0.56';

const ASSETS_TO_CACHE = [
  './',
  'static/manifest.webmanifest',
  'static/js/main.js',
  'static/js/state.js',
  'static/js/camera.js',
  'static/js/vision.js',
  'static/js/ui.js',
  'static/js/db.js',
  'static/js/ocr.js',
  'static/js/timing.js',
  'static/js/ai.js',
  'static/js/log.js',
  'static/js/swab.js',
  'static/js/geometry.js',
  'static/icons/icon-192.svg',
  'static/model/model.json',
  'static/model/weights.bin'
];

// Instalación: Precargar recursos esenciales de forma segura
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precargando assets en caché PWA...');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW] Precarga parcial completada:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activación: Limpieza total de cualquier caché distinta a la actual
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

// Estrategia Network-First con Bypass en Navegación Principal
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // En peticiones de navegación de página, forzar red limpia sin usar caché estática obsoleta
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'reload' })
        .catch(() => caches.match(event.request).then((res) => res || caches.match('./')))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});

// Listener para forzar actualización inmediata desde la app
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
