/* ChordRealm service worker — offline shell + song caching. */
const VERSION = "v2";
const STATIC_CACHE = `oc-static-${VERSION}`;
const DATA_CACHE = `oc-data-${VERSION}`;
const DOC_CACHE = `oc-docs-${VERSION}`;
const CURRENT = [STATIC_CACHE, DATA_CACHE, DOC_CACHE];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !CURRENT.includes(k)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const resp = await fetch(request);
  if (resp.ok) cache.put(request, resp.clone());
  return resp;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const resp = await fetch(request);
    if (resp.ok) cache.put(request, resp.clone());
    return resp;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Immutable Next build assets — cache-first.
  if (url.origin === self.location.origin && url.pathname.startsWith("/_next/static")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Supabase song/setlist reads — network-first so they're available offline.
  if (url.hostname.endsWith(".supabase.co") && url.pathname.startsWith("/rest/")) {
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }

  // Page navigations — network-first, falling back to a cached document offline.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(DOC_CACHE);
        try {
          const resp = await fetch(request);
          cache.put(request, resp.clone());
          return resp;
        } catch (err) {
          const fallback = (await cache.match(request)) || (await cache.match("/"));
          if (fallback) return fallback;
          throw err;
        }
      })(),
    );
  }
});
