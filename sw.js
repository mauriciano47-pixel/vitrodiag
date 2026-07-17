// VitroDiag SW — Build: 2026-07-17T02:07:00Z
const CACHE_NAME = 'vitrodiag-cache-v52';
const ASSETS = [
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5.0.5/dist/tesseract.min.js',
  'https://img.icons8.com/neon/96/glass-bottle.png',
  'https://img.icons8.com/neon/192/glass-bottle.png',
  'https://img.icons8.com/neon/512/glass-bottle.png'
];

// Instalación: Cachear únicamente recursos pesados externos (CDNs)
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW v52] Cacheando CDNs estáticos...');
        return cache.addAll(ASSETS);
      })
  );
});

// Activación: Limpieza de caches antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW v52] Eliminando cache antiguo:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      console.log('[SW v52] Tomando control...');
      return self.clients.claim();
    })
  );
});

// Intercepción: Passthrough directo para archivos de la app, Cache-First para CDNs
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  const url = new URL(event.request.url);
  const isCdn = url.hostname.includes('cdn.jsdelivr.net') || url.hostname.includes('img.icons8.com');

  if (isCdn) {
    // A. LIBRERÍAS PESADAS: Cache-First (Evita descargar 15MB en cada carga)
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
            });
        })
    );
  } else {
    // B. ARCHIVOS DE LA APP: Network-Only directo.
    // NUNCA más se cachearán index.html ni js/*.js. Las actualizaciones locales son INSTANTÁNEAS al refrescar.
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => caches.match(event.request))
    );
  }
});

// SKIP_WAITING forzado
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
