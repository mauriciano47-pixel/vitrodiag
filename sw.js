const CACHE_NAME = 'vitrodiag-cache-v48';
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

// Instalación: Cachear recursos estáticos y de visión artificial
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cacheando assets para uso offline en planta...');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activación: Limpieza de caches antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando cache antiguo:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercepción de peticiones con estrategias diferenciadas por tipo de recurso (v42)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  const url = new URL(event.request.url);
  const isCdn = url.hostname.includes('cdn.jsdelivr.net') || url.hostname.includes('img.icons8.com');

  if (isCdn) {
    // ESTRATEGIA A: Cache-First para librerías pesadas CDN externas (cero latencia y offline asegurado en planta)
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then(networkResponse => {
              if (networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, responseClone);
                });
              }
              return networkResponse;
            })
            .catch(() => {
              console.log('[Service Worker] Falló descarga de recurso CDN offline:', event.request.url);
            });
        })
    );
  } else {
    // ESTRATEGIA B: Network-First para archivos locales de la app (index.html, manifest.json)
    // Permite descargar actualizaciones instantáneas si hay red, con respaldo en caché offline si no hay señal.
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          console.log('[Service Worker] Modo Offline. Recuperando de caché local:', event.request.url);
          return caches.match(event.request);
        })
    );
  }
});


// Escuchar el mensaje para forzar la activación de la versión nueva de inmediato
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Activando versión nueva inmediatamente...');
    self.skipWaiting();
  }
});
