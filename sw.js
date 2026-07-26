/* Denní pohyb — offline cache.
   Po každé úpravě souborů zvyš číslo verze, jinou změnu dělat nemusíš. */
const VERZE = 'pohyb-v1';
const SOUBORY = [
  './',
  './index.html',
  './cviky.js',
  './app.js',
  './manifest.webmanifest',
  './ikona-192.png',
  './ikona-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERZE).then(c => c.addAll(SOUBORY)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(x => x !== VERZE).map(x => caches.delete(x))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;   // odesílání pokroku necachovat

  e.respondWith(
    caches.match(e.request).then(hit => {
      const sit = fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const kopie = res.clone();
          caches.open(VERZE).then(c => c.put(e.request, kopie));
        }
        return res;
      }).catch(() => hit);
      return hit || sit;
    })
  );
});
