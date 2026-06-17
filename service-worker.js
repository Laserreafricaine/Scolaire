const CACHE_NAME = "ecole-v3-20260617-2";
const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./assets/logo.webp",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./assets/avatars/afrique_fillette.webp",
  "./assets/avatars/asie_petite_fillette.webp",
  "./assets/avatars/europe_fillette.webp",
  "./assets/avatars/afrique_ado_fille.webp",
  "./assets/avatars/asie_ado_fille.webp",
  "./assets/avatars/europe_ado_fille.webp",
  "./assets/avatars/afrique_ado_garcon.webp",
  "./assets/avatars/asie_ado_garcon.webp",
  "./assets/avatars/europe_ado_garcon.webp"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request)
      .then(response => {
        if (!response || (!response.ok && response.type !== "opaque")) return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match("./index.html")))
  );
});
