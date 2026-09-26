const CACHE_NAME = 'croma-rgb-v17-credit-mauricio';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// INSTALACIÓN
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ACTIVACIÓN
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// PETICIONES
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const request = event.request;

  // ==========================================
  // HTML / NAVEGACIÓN
  // SIEMPRE INTENTAR RED ANTES QUE CACHÉ
  // ==========================================
  if (
    request.mode === 'navigate' ||
    request.headers.get('accept')?.includes('text/html')
  ) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, clone);
            });
          }

          return response;
        })
        .catch(() => {
          // Si no hay internet, utilizar la versión offline
          return caches.match(request)
            .then(cached => {
              return cached || caches.match('./index.html');
            });
        })
    );

    return;
  }

  // ==========================================
  // RESTO DE ARCHIVOS
  // CACHE FIRST + RED COMO FALLBACK
  // ==========================================
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) {
          return cached;
        }

        return fetch(request)
          .then(response => {
            if (!response || response.status !== 200) {
              return response;
            }

            const clone = response.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, clone);
            });

            return response;
          })
          .catch(() => {
            return undefined;
          });
      })
  );
});
