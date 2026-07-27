/* Denní pohyb — offline provoz a automatické aktualizace.
 *
 * Strategie: nejdřív síť, teprve při jejím selhání cache.
 * Díky tomu se každá změna nahraná na GitHub projeví při dalším spuštění
 * appky sama, bez zasahování do telefonu. Když telefon nemá signál,
 * appka naběhne z poslední uložené kopie.
 *
 * Jméno níž už měnit nemusíš — je to jen název úložiště, ne verze. */
const CACHE = 'pohyb';
const LIMIT_MS = 3000;          // jak dlouho čekat na síť, než sáhnu do cache

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
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SOUBORY))
      .catch(() => { })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== location.origin) return;  // odesílání pokroku neřešíme
  e.respondWith(sitNejdriv(e.request));
});

async function sitNejdriv(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await Promise.race([
      fetch(req, { cache: 'no-store' }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('pomalá síť')), LIMIT_MS))
    ]);
    if (res && res.status === 200) cache.put(req, res.clone()).catch(() => { });
    return res;
  } catch (err) {
    const hit = await cache.match(req);
    if (hit) return hit;
    if (req.mode === 'navigate') {
      const idx = await cache.match('./index.html');
      if (idx) return idx;
    }
    throw err;
  }
}

self.addEventListener('message', e => {
  if (e.data === 'aktualizuj') self.skipWaiting();
});
