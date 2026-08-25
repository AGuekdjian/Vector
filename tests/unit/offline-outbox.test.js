import "fake-indexeddb/auto";
import { webcrypto } from "node:crypto";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import {
  enqueueOperation,
  listPendingOperations,
  OUTBOX_STATUS,
  updateOperation,
  getOperation,
} from "@/offline/outbox";
import { syncOutbox } from "@/offline/sync-manager";
import {
  getCachedOrders,
  initializeOfflineIdentity,
  replaceCachedOrders,
} from "@/offline/indexed-db";
beforeAll(() => {
  if (!globalThis.crypto) globalThis.crypto = webcrypto;
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("replaces stale cached orders and isolates identities", async () => {
  await initializeOfflineIdentity("technician-a");
  await replaceCachedOrders([{ _id: "order-a" }, { _id: "stale" }]);
  await replaceCachedOrders([{ _id: "order-a", status: "IN_PROGRESS" }]);
  expect(await getCachedOrders()).toEqual([
    expect.objectContaining({ _id: "order-a", status: "IN_PROGRESS" }),
  ]);
  await initializeOfflineIdentity("technician-b");
  expect(await getCachedOrders()).toEqual([]);
});

it("marks an accepted offline operation as synced", async () => {
  Object.defineProperty(navigator, "onLine", {
    value: true,
    configurable: true,
  });
  const item = await enqueueOperation("START_ORDER", "sync-success", {});
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }));
  await syncOutbox();
  expect((await getOperation(item.operationId)).status).toBe(
    OUTBOX_STATUS.SYNCED,
  );
});

it("keeps rejected domain operations as visible conflicts", async () => {
  Object.defineProperty(navigator, "onLine", {
    value: true,
    configurable: true,
  });
  const item = await enqueueOperation("UPDATE_SYSTEM", "sync-conflict", {});
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 409 }));
  await syncOutbox();
  expect((await getOperation(item.operationId)).status).toBe(
    OUTBOX_STATUS.CONFLICT,
  );
});

it("persists transient failures for a later retry", async () => {
  Object.defineProperty(navigator, "onLine", {
    value: true,
    configurable: true,
  });
  const item = await enqueueOperation("COMPLETE_ORDER", "sync-retry", {});
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async () => {
      Object.defineProperty(navigator, "onLine", {
        value: false,
        configurable: true,
      });
      throw new Error("network unavailable");
    }),
  );
  await syncOutbox();
  expect(await getOperation(item.operationId)).toEqual(
    expect.objectContaining({ status: OUTBOX_STATUS.FAILED, attempts: 1 }),
  );
});
it("persists pending operations and never labels them synced early", async () => {
  const item = await enqueueOperation(
    "START_ORDER",
    "507f1f77bcf86cd799439011",
    {},
  );
  expect(item.status).toBe(OUTBOX_STATUS.PENDING);
  expect(
    (await listPendingOperations()).some(
      (x) => x.operationId === item.operationId,
    ),
  ).toBe(true);
  await updateOperation(item.operationId, { status: OUTBOX_STATUS.SYNCED });
  expect(
    (await listPendingOperations()).some(
      (x) => x.operationId === item.operationId,
    ),
  ).toBe(false);
});
