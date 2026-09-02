// Service worker — installation PWA + mode hors-ligne
const CACHE = 'ferme-1788340861317';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Ne JAMAIS intercepter les appels externes (Firebase : comptes et sauvegardes)
  // ni les écritures : le cache renverrait des réponses périmées.
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (e.request.mode === 'navigate') {
    // réseau d'abord (pour recevoir les mises à jour), cache en secours
    e.respondWith(
      fetch(e.request).then((res) => {
        const cp = res.clone();
        caches.open(CACHE).then((c) => c.put('./index.html', cp));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
  } else {
    e.respondWith(
      caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request).then((res) => {
        const cp = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, cp));
        return res;
      }))
    );
  }
});
