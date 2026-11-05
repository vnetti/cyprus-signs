// Take over right away so a new version doesn't wait for every tab to close.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Network-first, cache fallback: always fresh online, still opens offline. no-cache: revalidate with the server (ETag).
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request.mode !== 'navigate' ? new Request(e.request, { cache: 'no-cache' }) : e.request) // a navigate request can't take init options
      .then(r => { const copy = r.clone(); caches.open('v1').then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request))
  );
});
