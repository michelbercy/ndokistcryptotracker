const CACHE = 'cryptotrack-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Installation : mise en cache des fichiers statiques
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // active immédiatement sans attendre
});

// Activation : supprime TOUS les anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => {
        console.log('[SW] Suppression ancien cache:', k);
        return caches.delete(k);
      }))
    )
  );
  self.clients.claim(); // prend le contrôle immédiatement
});

// Fetch : réseau EN PRIORITÉ pour index.html (toujours frais)
// Cache en fallback pour les assets statiques
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // API CoinGecko : réseau uniquement, jamais de cache
  if (url.hostname.includes('coingecko.com')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response('{}', { headers: { 'Content-Type': 'application/json' } })
      )
    );
    return;
  }

  // index.html : réseau en priorité, cache en fallback
  if (url.pathname.endsWith('index.html') || url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Autres assets : cache en priorité, réseau en fallback
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
