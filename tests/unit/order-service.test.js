import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  findOneAndUpdate: vi.fn(),
  findOne: vi.fn(),
  recordAudit: vi.fn(),
}));
vi.mock("@/modules/service-orders/service-order.model", () => ({
  ServiceOrder: {
    findOneAndUpdate: mocks.findOneAndUpdate,
    findOne: mocks.findOne,
  },
}));
vi.mock("@/modules/audit/audit.service", () => ({
  recordAudit: mocks.recordAudit,
}));
import {
  completeOrder,
  startOrder,
} from "@/modules/service-orders/order.service";
const actor = { id: "507f1f77bcf86cd799439011", role: "TECHNICIAN" };
beforeEach(() => vi.clearAllMocks());
describe("order state transitions", () => {
  it("starts only an assigned order belonging to the technician", async () => {
    mocks.findOneAndUpdate.mockResolvedValue({
      _id: "order",
      status: "IN_PROGRESS",
    });
    await startOrder({ orderId: "order", actor, requestId: "req" });
    expect(mocks.findOneAndUpdate.mock.calls[0][0]).toMatchObject({
      status: "ASSIGNED",
      responsibleTechnicianId: actor.id,
    });
    expect(mocks.recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "ORDER_STARTED" }),
    );
  });
  it("rejects invalid transitions", async () => {
    mocks.findOneAndUpdate.mockResolvedValue(null);
    await expect(startOrder({ orderId: "order", actor })).rejects.toMatchObject(
      { code: "ORDER_NOT_ASSIGNED" },
    );
  });
  it.each(["COMPLETED", "REQUIRES_QUOTE", "NOT_COMPLETED"])(
    "records completion result %s",
    async (result) => {
      mocks.findOneAndUpdate.mockResolvedValue({
        _id: "order",
        status: result,
      });
      await completeOrder({
        orderId: "order",
        actor,
        data: {
          result,
          observation: "Detalle",
          quoteDetails: "Cotizar",
          notCompletedReasonId: "507f1f77bcf86cd799439012",
        },
        requestId: "req",
      });
      expect(mocks.findOneAndUpdate.mock.calls[0][1].$set).toMatchObject({
        status: result,
        completionResult: result,
      });
    },
  );
});
