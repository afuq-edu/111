/* منصة المعلم الأول — عمل بدون إنترنت.
   عند تعديل index.html غيّر رقم النسخة VER ليصل التحديث للمستخدمين. */
const VER = 'stp2-v1';
const FONTS = 'stp-fonts';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-32.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VER && k !== FONTS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    const key = req.mode === 'navigate' ? './index.html' : req;
    e.respondWith(
      caches.open(VER).then(async cache => {
        const hit = await cache.match(key, { ignoreSearch: true });
        const net = fetch(req).then(res => {
          if (res && res.ok) cache.put(key, res.clone());
          return res;
        }).catch(() => null);
        if (hit) { e.waitUntil(net); return hit; }
        return (await net) || (req.mode === 'navigate' ? cache.match('./index.html') : Response.error());
      })
    );
    return;
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(FONTS).then(async cache => {
        const hit = await cache.match(req);
        const net = fetch(req).then(res => {
          if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
          return res;
        }).catch(() => null);
        if (hit) { e.waitUntil(net); return hit; }
        return (await net) || Response.error();
      })
    );
  }
});
