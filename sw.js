const CACHE_NAME = 'vitrodiag-cache-v23';
const ASSETS = [
  './index.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js',
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

// Intercepción de peticiones (Estrategia Cache First con red de respaldo)
self.addEventListener('fetch', event => {
  // Ignorar peticiones que no sean GET o que tengan esquemas no soportados (ej. chrome-extension://)
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Si no está en cache, ir a la red
        return fetch(event.request)
          .then(networkResponse => {
            // Guardar en cache para la próxima vez
            if (networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Offline fallback
            console.log('[Service Worker] Petición fallida y sin cache para:', event.request.url);
          });
      })
  );
});


// Escuchar el mensaje para forzar la activación de la versión nueva de inmediato
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Activando versión nueva inmediatamente...');
    self.skipWaiting();
  }
});
