// Bump this whenever the precached application shell changes so existing
// offline users receive the repaired shell instead of a cache-first old one.
const CACHE = 'pulse-check-v4';
const SHELL = [
  '/',
  '/demo',
  '/privacy/',
  '/terms/',
  '/404.html',
  '/legal.css',
  '/assets/pulse-bench-768.webp',
  '/assets/pulse-bench-1536.webp',
  '/assets/pulse-check-social.jpg',
  '/apple-touch-icon.png',
  '/favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then(async (cache) => {
    await cache.addAll(SHELL);
    const html = await (await fetch('/')).text();
    const builtAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map((match) => match[1]);
    await cache.addAll([...new Set(builtAssets)]);
  }));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok && new URL(event.request.url).origin === self.location.origin) {
        const clone = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match('/'))),
  );
});
