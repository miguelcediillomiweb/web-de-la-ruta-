importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// Service worker de Grupo Peñafiel. Su prefijo evita tocar cachés de otros proyectos.
const PREFIJO = 'grupo-penafiel-web-';
const CACHE = PREFIJO + 'v18'; // si cambias archivos importantes, sube el número (v14, v15...)
const BASE = ['./', 'index.html', 'css/estilos.css', 'css/efectos.css', 'css/portada.css', 'css/marca.css', 'css/whatsapp.css', 'css/instalar.css', 'css/salir.css', 'js/instalar.js', 'js/salir.js', 'js/extras.js', 'js/portada.js', 'js/marca.js', 'js/whatsapp.js', 'js/config.js', 'js/app.js', 'js/pwa.js', 'js/onesignal.js',
  'manifest.json', 'iconos/icon-192-1.png', 'iconos/icon-512-1.png'];

// Guarda cada archivo por separado: si falta uno, los demás se guardan igual.
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(BASE.map((url) => c.add(url))))
      .then(() => self.skipWaiting())
  );
});

// Borra solo las versiones viejas de ESTA web; nunca toca las cachés de otros proyectos.
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k.startsWith(PREFIJO) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Primero la red (siempre lo más nuevo); si no hay señal, usa lo guardado.
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    fetch(r)
      .then((res) => {
        if (res.ok) {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(r, copia));
        }
        return res;
      })
      .catch(() => caches.open(CACHE).then((c) =>
        c.match(r).then((hit) => hit || (r.mode === 'navigate' ? c.match('index.html') : Response.error()))
      ))
  );
});
