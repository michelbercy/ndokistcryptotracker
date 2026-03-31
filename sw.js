const CACHE = 'cryptotrack-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Installation : mise en cache des fichiers statiques
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch : réseau en priorité, cache en fallback
self.addEventListener('fetch', e => {
  // Les appels API CoinGecko ne sont jamais mis en cache
  if (e.request.url.includes('api.coingecko.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }
  // Pour les assets locaux : cache first, puis réseau
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
