// Service worker: permite instalar la web como app y abrirla aunque no haya señal.
// Más adelante aquí mismo se conecta OneSignal (notificaciones).
const PREFIJO = 'grupo-penafiel-web-';
const CACHE = PREFIJO + 'v1';
const BASE = ['./', 'index.html', 'css/estilos.css', 'js/config.js', 'js/app.js', 'js/pwa.js',
              'manifest.json', 'iconos/icon-192.png', 'iconos/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(BASE.map((url) => c.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k.startsWith(PREFIJO) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    fetch(r)
      .then((res) => {
        if (res.ok) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(r, copia)); }
        return res;
      })
      .catch(() =>
        caches.open(CACHE).then((c) =>
          c.match(r).then((hit) => hit || (r.mode === 'navigate' ? c.match('index.html') : Response.error()))
        )
      )
  );
});
