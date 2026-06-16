var CACHE_NAME = 'maze-v1';
var PRECACHE = [
  '/index.html',
  '/src/main.js',
  '/src/styles.css',
  '/src/GLTFLoader.js',
  'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.min.js'
];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE_NAME).then(function(cache) {
    return cache.addAll(PRECACHE.filter(function(u) { return !u.startsWith('http'); }));
  }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  e.respondWith(caches.match(e.request).then(function(cached) {
    if (cached) return cached;
    return fetch(e.request).then(function(response) {
      if (!response || response.status !== 200 || response.type === 'opaque') return response;
      var clone = response.clone();
      caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
      return response;
    }).catch(function() { return cached; });
  }));
});
