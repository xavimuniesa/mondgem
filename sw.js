// Service worker: permet instal·lar l'app i obrir-la sense connexió.
// Quan canviïs index.html, puja el número de CACHE_VERSION perquè els mòbils agafin la versió nova.
const CACHE_VERSION = 'rellotge-v13';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Dades del temps, població i tipografies: sempre de la xarxa (no es guarden)
  if (url.origin !== self.location.origin) return;

  // La pàgina: primer la xarxa (per tenir sempre la darrera versió), i si no n'hi ha, la còpia guardada
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Icones i manifest: la còpia guardada si n'hi ha
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});
