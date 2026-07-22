// VitroDiag - Service Worker (Network-First Strategy with Cache Fallback for PWA Offline)
const CACHE_NAME = 'vitrodiag-cache-v1.0.55-FINAL';

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
        console.warn('[SW] Precarga parcial completada (algunos recursos opcionales no encontrados):', err);
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

// Estrategia Network-First con Fallback a Cache (Ideal para PWA Offline en Planta y Celulares)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // BYPASS: No interceptar peticiones cross-origin (CDNs, tfjs, tesseract, etc.)
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return; // Dejar que el navegador lo maneje de forma nativa sin SW
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
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('./') || caches.match('/');
          }
          // Si no hay respuesta de red ni en caché, devolver error explícito
          return Response.error();
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
