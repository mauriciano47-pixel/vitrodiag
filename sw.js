// VitroDiag SW — Build: 2026-07-17T02:06:00Z
const CACHE_NAME = 'vitrodiag-cache-v51';
const ASSETS = [
  './index.html',
  './manifest.json',
  './js/state.js',
  './js/db.js',
  './js/camera.js',
  './js/vision.js',
  './js/ai.js',
  './js/geometry.js',
  './js/timing.js',
  './js/swab.js',
  './js/log.js',
  './js/ocr.js',
  './js/ui.js',
  './js/main.js',
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5.0.5/dist/tesseract.min.js',
  'https://img.icons8.com/neon/96/glass-bottle.png',
  'https://img.icons8.com/neon/192/glass-bottle.png',
  'https://img.icons8.com/neon/512/glass-bottle.png'
];

// URLs que NUNCA deben ser cacheadas (siempre van a la red para detectar versiones nuevas)
const NEVER_CACHE = [
  'version.json',
  'sw.js'
];

// Instalación: Cachear recursos estáticos y de visión artificial
self.addEventListener('install', event => {
  // skipWaiting() inmediato en install para no quedarse en "waiting" nunca
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW v51] Cacheando assets para uso offline...');
        return cache.addAll(ASSETS);
      })
  );
});

// Activación: Limpiar caches viejos y tomar el control de todos los clientes abiertos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW v51] Eliminando cache antiguo:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      console.log('[SW v51] Tomando control de todos los clientes abiertos...');
      return self.clients.claim(); // Toma el control de pestañas abiertas sin esperar recarga
    })
  );
});

// Intercepción de peticiones con estrategias diferenciadas por tipo de recurso
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  const url = new URL(event.request.url);
  const isCdn = url.hostname.includes('cdn.jsdelivr.net') || url.hostname.includes('img.icons8.com');

  // ESTRATEGIA 0: Network-Only para archivos críticos que nunca deben ser cacheados
  // Esto garantiza que version.json y sw.js siempre vengan frescos del servidor
  const isNeverCache = NEVER_CACHE.some(nc => url.pathname.endsWith(nc));
  if (isNeverCache) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } }))
    );
    return;
  }

  if (isCdn) {
    // ESTRATEGIA A: Cache-First para librerías pesadas CDN externas
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          return fetch(event.request)
            .then(networkResponse => {
              if (networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
              }
              return networkResponse;
            })
            .catch(() => {
              console.log('[SW v51] Falló descarga CDN offline:', event.request.url);
            });
        })
    );
  } else {
    // ESTRATEGIA B: Stale-While-Revalidate para archivos locales de la app
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          const fetchPromise = fetch(event.request)
            .then(networkResponse => {
              if (networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
              }
              return networkResponse;
            })
            .catch(() => {
              console.log('[SW v51] Offline - sirviendo desde caché:', event.request.url);
            });
          return cachedResponse || fetchPromise;
        })
    );
  }
});

// Escuchar el mensaje para forzar la activación de la versión nueva de inmediato
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW v51] Activando versión nueva inmediatamente...');
    self.skipWaiting();
  }
});
