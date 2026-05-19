const CACHE = 'multitech-v5';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/nav.html',
  '/mt-login.html',
  '/mt-signup.html',
  '/mt-ajustes.html',
  '/multitech-contacto.html',
  '/multitech-servicios.html',
  '/multitech-plantillas.html',
  '/admin-nav.html',
  '/admin-dashboard.html',
  '/mt-javascript/admin-nav.js',
  '/admin-clientes.html',
  '/admin-config.html',
  '/admin-consultas.html',
  '/admin-cotizaciones.html',
  '/admin-encuestas.html',
  '/admin-finanzas.html',
  '/admin-usuarios-normal.html',
  '/admin-mensajes.html',
  '/admin-proyectos.html',
  '/manifest.json',
  '/assets/iconos/pwa-icon.svg',
  '/assets/iconos/apple-touch-icon.svg',
  '/assets/imagenes/nexalogo.svg',
  '/assets/svg/nexalogo.svg',
  '/mt-styles/index-styles.css',
  '/mt-styles/admin-styles.css',
  '/mt-styles/mt-general-styles.css',
  '/mt-styles/multitech-contacto.styles.css',
  '/mt-styles/multitech-plantillas-styles.css',
  '/mt-styles/multitech-servicios-styles.css',
  '/mt-javascript/mt-auth-client.js',
  '/mt-javascript/mt-i18n.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(req));
    return;
  }

  if (
    url.pathname.endsWith('.html') ||
    url.pathname === '/' ||
    url.pathname === '' ||
    url.pathname.startsWith('/mt-styles/') ||
    url.pathname.startsWith('/mt-javascript/')
  ) {
    event.respondWith(networkFirst(req));
    return;
  }

  event.respondWith(cacheFirst(req));
});

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok && res.type === 'basic') {
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    return caches.match('/index.html');
  }
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(req);
    return cached || new Response(JSON.stringify({ success: false, message: 'Sin conexión' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
