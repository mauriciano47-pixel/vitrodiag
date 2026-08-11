// VitroDiag NEXUS v2.0.3 — Service Worker (Network-First + Auto-Reload Shield)
const CACHE_NAME = 'vitrodiag-nexus-v2.0.3';

const ASSETS_TO_CACHE = [
  './',
  'manifest.webmanifest',
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
  'static/js/geminiVision.js',
  'static/js/datasetManager.js',
  'static/icons/icon-192.svg',
  'static/icons/icon-512.svg',
  'static/icons/icon-192.png',
  'static/icons/icon-512.png',
  'apple-touch-icon.png',
  'favicon.ico'
];

// Instalación: Precargar recursos de forma tolerante a fallos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[NEXUS SW] Precargando assets...');
      return Promise.allSettled(
        ASSETS_TO_CACHE.map((url) => 
          cache.add(url).catch((err) => console.warn('[NEXUS SW] No se pudo cachear:', url, err))
        )
      );
    })
  );
  self.skipWaiting();
});

// Activación: Limpieza de cachés anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[NEXUS SW] Eliminando caché antigua:', cache);
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

// Listener para forzar actualización
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
