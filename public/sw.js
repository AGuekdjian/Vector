const CACHE = "vector-shell-v3";
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
  if (event.tag === "vector-outbox") event.waitUntil(syncOutbox());
});

const openOfflineDb = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open("vector-offline", 2);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const allOutbox = (db) =>
  new Promise((resolve, reject) => {
    const request = db.transaction("outbox").objectStore("outbox").getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const putOutbox = (db, operation) =>
  new Promise((resolve, reject) => {
    const transaction = db.transaction("outbox", "readwrite");
    transaction.objectStore("outbox").put(operation);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });

async function notifyOutboxChanged() {
  for (const client of await self.clients.matchAll())
    client.postMessage({ type: "OUTBOX_CHANGED" });
}

async function syncOutbox() {
  const db = await openOfflineDb();
  const operations = (await allOutbox(db)).filter((operation) =>
    ["PENDING", "FAILED"].includes(operation.status),
  );
  for (const operation of operations) {
    await putOutbox(db, { ...operation, status: "SYNCING" });
    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(operation),
      });
      const conflict = [400, 403, 404, 409, 422].includes(response.status);
      if (!response.ok && !conflict) throw new Error("sync failed");
      await putOutbox(db, {
        ...operation,
        status: conflict ? "CONFLICT" : "SYNCED",
        ...(conflict ? {} : { syncedAt: new Date().toISOString() }),
      });
    } catch (error) {
      await putOutbox(db, {
        ...operation,
        status: "FAILED",
        attempts: (operation.attempts || 0) + 1,
      });
      throw error;
    }
  }
  await notifyOutboxChanged();
}
