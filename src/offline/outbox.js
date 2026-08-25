import { getOfflineDb } from "./indexed-db";
export const OUTBOX_STATUS = {
  PENDING: "PENDING",
  SYNCING: "SYNCING",
  SYNCED: "SYNCED",
  FAILED: "FAILED",
  CONFLICT: "CONFLICT",
};
const notify = () =>
  typeof window !== "undefined" &&
  window.dispatchEvent(new Event("vector:outbox-changed"));
export async function enqueueOperation(kind, entityId, payload) {
  const operation = {
    operationId: crypto.randomUUID(),
    kind,
    entityId,
    payload,
    status: OUTBOX_STATUS.PENDING,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  await (await getOfflineDb()).put("outbox", operation);
  notify();
  navigator.serviceWorker?.ready
    .then((registration) => registration.sync?.register("vector-outbox"))
    .catch(() => {});
  return operation;
}
export async function listPendingOperations() {
  const db = await getOfflineDb();
  const all = await db.getAll("outbox");
  return all.filter((item) =>
    [OUTBOX_STATUS.PENDING, OUTBOX_STATUS.FAILED].includes(item.status),
  );
}
export async function updateOperation(operationId, patch) {
  const db = await getOfflineDb();
  const item = await db.get("outbox", operationId);
  if (item) await db.put("outbox", { ...item, ...patch });
  notify();
}
export async function getOutboxCounts() {
  const all = await (await getOfflineDb()).getAll("outbox");
  return {
    pending: all.filter((item) =>
      [
        OUTBOX_STATUS.PENDING,
        OUTBOX_STATUS.SYNCING,
        OUTBOX_STATUS.FAILED,
      ].includes(item.status),
    ).length,
    conflicts: all.filter((item) => item.status === OUTBOX_STATUS.CONFLICT)
      .length,
  };
}
export async function listOutboxOperations() {
  return (await getOfflineDb()).getAll("outbox");
}
export async function getOperation(operationId) {
  return (await getOfflineDb()).get("outbox", operationId);
}
export async function retryOperation(operationId) {
  await updateOperation(operationId, { status: OUTBOX_STATUS.PENDING });
}
export async function discardOperation(operationId) {
  await (await getOfflineDb()).delete("outbox", operationId);
  notify();
}
