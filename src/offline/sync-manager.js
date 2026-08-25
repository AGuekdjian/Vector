import {
  listPendingOperations,
  OUTBOX_STATUS,
  updateOperation,
} from "./outbox";
let active = false;
export async function syncOutbox() {
  if (active || !navigator.onLine) return;
  active = true;
  let retryDelay = 0;
  try {
    for (const operation of await listPendingOperations()) {
      await updateOperation(operation.operationId, {
        status: OUTBOX_STATUS.SYNCING,
      });
      try {
        const response = await fetch("/api/sync", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(operation),
        });
        if ([400, 403, 404, 409, 422].includes(response.status))
          await updateOperation(operation.operationId, {
            status: OUTBOX_STATUS.CONFLICT,
          });
        else if (!response.ok) throw new Error("sync failed");
        else
          await updateOperation(operation.operationId, {
            status: OUTBOX_STATUS.SYNCED,
            syncedAt: new Date().toISOString(),
          });
      } catch {
        const attempts = operation.attempts + 1;
        await updateOperation(operation.operationId, {
          status: OUTBOX_STATUS.FAILED,
          attempts,
        });
        retryDelay = Math.max(
          retryDelay,
          Math.min(60_000, 1_000 * 2 ** Math.min(attempts, 6)),
        );
      }
    }
  } finally {
    active = false;
    if (retryDelay && navigator.onLine) setTimeout(syncOutbox, retryDelay);
  }
}
