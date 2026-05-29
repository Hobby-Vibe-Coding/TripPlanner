const CACHE = "trip-planner-v1";
const OFFLINE_URLS = ["/", "/index.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Always go network-first for API calls; fall through on failure.
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ error: "You are offline. Changes cannot be saved." }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // For the app shell: serve from cache immediately, revalidate in the background.
  if (e.request.mode === "navigate" || OFFLINE_URLS.includes(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        // Background revalidation — always silent on failure so it never
        // causes an unhandled rejection when the dev server is starting up.
        const networkFetch = fetch(e.request)
          .then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE).then((c) => c.put(e.request, clone));
            }
            return res;
          })
          .catch(() => {
            // Network unavailable — already serving from cache, nothing to do.
          });

        // Serve the cached version immediately if available; otherwise wait
        // for the network (first load with empty cache).
        return cached || networkFetch;
      })
    );
  }
});
