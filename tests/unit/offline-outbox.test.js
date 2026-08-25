import "fake-indexeddb/auto";
import { webcrypto } from "node:crypto";
import { beforeAll, expect, it } from "vitest";
import {
  enqueueOperation,
  listPendingOperations,
  OUTBOX_STATUS,
  updateOperation,
} from "@/offline/outbox";
import {
  getCachedOrders,
  initializeOfflineIdentity,
  replaceCachedOrders,
} from "@/offline/indexed-db";
beforeAll(() => {
  if (!globalThis.crypto) globalThis.crypto = webcrypto;
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
