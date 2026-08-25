const CACHE = "vector-shell-v2";
const SHELL = ["/", "/login", "/offline", "/technician/orders", "/icon.svg"];
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/"))
    return;
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            if (response.ok)
              caches
                .open(CACHE)
                .then((cache) => cache.put(event.request, response.clone()));
            return response;
          }),
      ),
    );
    return;
  }
  if (event.request.mode === "navigate")
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/offline")),
    );
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "CLEAR_PRIVATE_CACHES")
    event.waitUntil(
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key !== CACHE)
              .map((key) => caches.delete(key)),
          ),
        ),
    );
});
self.addEventListener("sync", (event) => {
  if (event.tag === "vector-outbox")
    event.waitUntil(
      self.clients
        .matchAll()
        .then((clients) =>
          clients.forEach((client) =>
            client.postMessage({ type: "SYNC_OUTBOX" }),
          ),
        ),
    );
});
