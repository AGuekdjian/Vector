import { openDB } from "idb";
const DB_NAME = "vector-offline";
const VERSION = 2;
export function getOfflineDb() {
  if (typeof indexedDB === "undefined")
    throw new Error("IndexedDB no está disponible.");
  return openDB(DB_NAME, VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("orders"))
        db.createObjectStore("orders", { keyPath: "_id" });
      if (!db.objectStoreNames.contains("outbox")) {
        const store = db.createObjectStore("outbox", {
          keyPath: "operationId",
        });
        store.createIndex("status", "status");
      }
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
    },
  });
}
export async function cacheOrders(orders) {
  const db = await getOfflineDb();
  const tx = db.transaction("orders", "readwrite");
  await Promise.all([...orders.map((order) => tx.store.put(order)), tx.done]);
}
export async function getCachedOrders() {
  return (await getOfflineDb()).getAll("orders");
}
export async function getCachedOrder(id) {
  return (await getOfflineDb()).get("orders", id);
}
export async function patchCachedOrder(id, updater) {
  const db = await getOfflineDb();
  const current = await db.get("orders", id);
  if (!current) return null;
  const next =
    typeof updater === "function"
      ? updater(current)
      : { ...current, ...updater };
  await db.put("orders", next);
  return next;
}
export async function initializeOfflineIdentity(userId) {
  const db = await getOfflineDb();
  const current = await db.get("meta", "userId");
  if (current && current !== userId) {
    await db.clear("orders");
    await db.clear("outbox");
  }
  await db.put("meta", userId, "userId");
}
export async function clearOfflineData() {
  const db = await getOfflineDb();
  await Promise.all([db.clear("orders"), db.clear("outbox"), db.clear("meta")]);
}
