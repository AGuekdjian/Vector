import { AppError } from "@/lib/errors/app-error";
import { recordAudit } from "@/modules/audit/audit.service";
import { ServiceOrder } from "./service-order.model";

export async function startOrder({ orderId, actor, requestId, operationId }) {
  if (operationId) {
    const existing = await ServiceOrder.findOne({
      _id: orderId,
      active: true,
      ...(actor.role === "TECHNICIAN"
        ? { responsibleTechnicianId: actor.id }
        : {}),
      "timeline.operationId": operationId,
    });
    if (existing) {
      await recordAudit({
        actorUserId: actor.id,
        action: "ORDER_STARTED",
        entityType: "ServiceOrder",
        entityId: existing._id,
        requestId,
        operationId,
      });
      return existing;
    }
  }
  const filter = { _id: orderId, active: true, status: "ASSIGNED" };
  if (actor.role === "TECHNICIAN") filter.responsibleTechnicianId = actor.id;
  const now = new Date();
  const item = await ServiceOrder.findOneAndUpdate(
    filter,
    {
      $set: { status: "IN_PROGRESS", startedAt: now, updatedBy: actor.id },
      $push: {
        timeline: {
          operationId,
          action: "ORDER_STARTED",
          actorUserId: actor.id,
          createdAt: now,
        },
      },
    },
    { returnDocument: "after" },
  );
  if (!item)
    throw new AppError(
      actor.role === "TECHNICIAN"
        ? "ORDER_NOT_ASSIGNED"
        : "INVALID_ORDER_STATE",
      "La orden no puede iniciarse.",
      409,
    );
  await recordAudit({
    actorUserId: actor.id,
    action: "ORDER_STARTED",
    entityType: "ServiceOrder",
    entityId: item._id,
    requestId,
    operationId,
  });
  return item;
}
export async function completeOrder({
  orderId,
  actor,
  data,
  requestId,
  operationId,
}) {
  if (operationId) {
    const existing = await ServiceOrder.findOne({
      _id: orderId,
      active: true,
      ...(actor.role === "TECHNICIAN"
        ? { responsibleTechnicianId: actor.id }
        : {}),
      "timeline.operationId": operationId,
    });
    if (existing) {
      await recordAudit({
        actorUserId: actor.id,
        action: `ORDER_${data.result}`,
        entityType: "ServiceOrder",
        entityId: existing._id,
        requestId,
        operationId,
      });
      return existing;
    }
  }
  const filter = { _id: orderId, active: true, status: "IN_PROGRESS" };
  if (actor.role === "TECHNICIAN") filter.responsibleTechnicianId = actor.id;
  const now = new Date();
  const set = {
    status: data.result,
    completionResult: data.result,
    technicianObservation: data.observation || "",
    completedAt: now,
    updatedBy: actor.id,
  };
  if (data.result === "REQUIRES_QUOTE") set.quoteDetails = data.quoteDetails;
  if (data.result === "NOT_COMPLETED")
    set.notCompletedReasonId = data.notCompletedReasonId;
  const item = await ServiceOrder.findOneAndUpdate(
    filter,
    {
      $set: set,
      $push: {
        timeline: {
          operationId,
          action: `ORDER_${data.result}`,
          actorUserId: actor.id,
          createdAt: now,
        },
      },
    },
    { returnDocument: "after" },
  );
  if (!item)
    throw new AppError(
      actor.role === "TECHNICIAN"
        ? "ORDER_NOT_ASSIGNED"
        : "INVALID_ORDER_STATE",
      "La orden no puede finalizarse.",
      409,
    );
  await recordAudit({
    actorUserId: actor.id,
    action: `ORDER_${data.result}`,
    entityType: "ServiceOrder",
    entityId: item._id,
    requestId,
    operationId,
  });
  return item;
}
