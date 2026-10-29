// Replaced with a content hash by the build script. Versioned caches only affect this app.
const CACHE_NAME = 'duo-pocket-lab-__BUILD_VERSION__';
const ROOT = new URL('./', self.location.href);
const ASSETS = ['./', './index.html', './src/app.js', './src/model.js', './src/styles.css', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png'];
const ASSET_URLS = new Set(ASSETS.map(path => new URL(path, ROOT).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS.map(path => new Request(new URL(path, ROOT), { cache: 'reload' })))));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('duo-pocket-lab-') && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;
  if (event.request.mode === 'navigate') {
    // Cached shell and cached modules always belong to the same released version.
    event.respondWith(caches.open(CACHE_NAME).then(async cache => (await cache.match(new URL('./', ROOT))) || fetch(event.request)));
  } else if (ASSET_URLS.has(url.href)) {
    event.respondWith(caches.open(CACHE_NAME).then(async cache => (await cache.match(event.request)) || fetch(event.request)));
  }
});
