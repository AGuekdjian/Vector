import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDatabase } from "@/lib/db/mongoose";
import { AppError } from "@/lib/errors/app-error";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { parseJson } from "@/lib/validation/request";
import { completionSchema } from "@/modules/service-orders/order.schemas";
import {
  completeOrder,
  startOrder,
} from "@/modules/service-orders/order.service";
import { SyncOperation } from "@/modules/sync/sync-operation.model";
import { ServiceOrder } from "@/modules/service-orders/service-order.model";
import { InstalledSystem } from "@/modules/systems/installed-system.model";
import {
  systemSchema,
  systemUpdateSchema,
} from "@/modules/systems/system.schemas";
import { recordAudit } from "@/modules/audit/audit.service";
import { NotCompletedReason } from "@/modules/service-orders/not-completed-reason.model";
import { appendOrderTimeline } from "@/modules/service-orders/order-timeline.service";

const schema = z.object({
  operationId: z.uuid(),
  kind: z.enum([
    "START_ORDER",
    "COMPLETE_ORDER",
    "UPDATE_SYSTEM",
    "ADD_SYSTEM",
    "RETIRE_SYSTEM",
    "REPLACE_SYSTEM",
  ]),
  entityId: z.string().regex(/^[a-f\d]{24}$/i),
  payload: z.record(z.string(), z.unknown()).default({}),
});
const hash = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
export const POST = withApiHandler(async (request, _context, { requestId }) => {
  const actor = await requireUser(["TECHNICIAN"]);
  const operation = await parseJson(request, schema);
  await connectDatabase();
  const payloadHash = hash({
    kind: operation.kind,
    entityId: operation.entityId,
    payload: operation.payload,
  });
  let stored = await SyncOperation.findOne({
    operationId: operation.operationId,
  });
  if (stored) {
    if (String(stored.userId) !== actor.id)
      throw new AppError(
        "SYNC_CONFLICT",
        "El identificador de operación ya está en uso.",
        409,
      );
    if (stored.payloadHash !== payloadHash)
      throw new AppError(
        "SYNC_CONFLICT",
        "El identificador ya fue utilizado con otros datos.",
        409,
      );
    if (stored.processedAt)
      return NextResponse.json({ duplicate: true, result: stored.result });
  } else {
    try {
      stored = await SyncOperation.create({
        operationId: operation.operationId,
        userId: actor.id,
        kind: operation.kind,
        entityId: operation.entityId,
        payloadHash,
      });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      stored = await SyncOperation.findOne({
        operationId: operation.operationId,
      });
      if (String(stored.userId) !== actor.id)
        throw new AppError(
          "SYNC_CONFLICT",
          "El identificador de operación ya está en uso.",
          409,
        );
      if (stored.payloadHash !== payloadHash)
        throw new AppError("SYNC_CONFLICT", "Operación en conflicto.", 409);
    }
  }
  stored = await SyncOperation.findOneAndUpdate(
    {
      _id: stored._id,
      processedAt: null,
      $or: [
        { processingUntil: null },
        { processingUntil: { $lt: new Date() } },
      ],
    },
    { $set: { processingUntil: new Date(Date.now() + 30_000) } },
    { new: true },
  );
  if (!stored)
    throw new AppError("SYNC_BUSY", "La operación ya se está procesando.", 503);
  let result;
  const existingSystem = ["ADD_SYSTEM", "REPLACE_SYSTEM"].includes(
    operation.kind,
  )
    ? await InstalledSystem.findOne({ operationId: operation.operationId })
    : null;
  if (existingSystem) result = existingSystem;
  else if (operation.kind === "START_ORDER")
    result = await startOrder({
      orderId: operation.entityId,
      actor,
      requestId,
      operationId: operation.operationId,
    });
  else if (operation.kind === "COMPLETE_ORDER") {
    const completion = completionSchema.parse(operation.payload);
    if (
      completion.result === "NOT_COMPLETED" &&
      !(await NotCompletedReason.exists({
        _id: completion.notCompletedReasonId,
        active: true,
      }))
    )
      throw new AppError(
        "REASON_NOT_FOUND",
        "El motivo seleccionado no está disponible.",
        400,
      );
    result = await completeOrder({
      orderId: operation.entityId,
      actor,
      data: completion,
      requestId,
      operationId: operation.operationId,
    });
  } else if (operation.kind === "ADD_SYSTEM") {
    const order = await ServiceOrder.findOne({
      _id: operation.entityId,
      responsibleTechnicianId: actor.id,
      active: true,
      status: { $in: ["ASSIGNED", "IN_PROGRESS"] },
    });
    if (!order)
      throw new AppError(
        "ORDER_NOT_ASSIGNED",
        "No tienes acceso a esta orden.",
        403,
      );
    const data = systemSchema.parse({
      ...operation.payload,
      installationId: String(order.installationId),
    });
    result = await InstalledSystem.create({
      ...data,
      operationId: operation.operationId,
      installedByServiceOrderId: order._id,
    });
    await recordAudit({
      actorUserId: actor.id,
      action: "SYSTEM_ADDED",
      entityType: "InstalledSystem",
      entityId: result._id,
      requestId,
      operationId: operation.operationId,
    });
    await appendOrderTimeline({
      orderId: order._id,
      actorUserId: actor.id,
      action: "SYSTEM_ADDED",
      operationId: operation.operationId,
      metadata: { systemId: String(result._id) },
    });
  } else {
    const { serviceOrderId, ...changes } = operation.payload;
    const system = await InstalledSystem.findById(operation.entityId);
    if (!system)
      throw new AppError("SYSTEM_NOT_FOUND", "Sistema no encontrado.", 404);
    const order = await ServiceOrder.findOne({
      _id: serviceOrderId,
      installationId: system.installationId,
      responsibleTechnicianId: actor.id,
      active: true,
      status: { $in: ["ASSIGNED", "IN_PROGRESS"] },
    });
    if (!order)
      throw new AppError(
        "ORDER_NOT_ASSIGNED",
        "No tienes acceso a esta orden.",
        403,
      );
    if (operation.kind === "UPDATE_SYSTEM") {
      const validChanges = systemUpdateSchema.parse(changes);
      Object.assign(system, validChanges);
      result = await system.save();
      await recordAudit({
        actorUserId: actor.id,
        action: "SYSTEM_UPDATED",
        entityType: "InstalledSystem",
        entityId: result._id,
        requestId,
        operationId: operation.operationId,
        metadata: { fields: Object.keys(validChanges) },
      });
      await appendOrderTimeline({
        orderId: order._id,
        actorUserId: actor.id,
        action: "SYSTEM_UPDATED",
        operationId: operation.operationId,
        metadata: {
          systemId: String(result._id),
          fields: Object.keys(validChanges),
        },
      });
    } else if (operation.kind === "RETIRE_SYSTEM") {
      if (system.removedOperationId === operation.operationId) result = system;
      else if (system.status !== "ACTIVE")
        throw new AppError(
          "SYNC_CONFLICT",
          "El sistema ya no está activo.",
          409,
        );
      else {
        system.status = "RETIRED";
        system.retiredAt = new Date();
        system.removedByServiceOrderId = order._id;
        system.removedOperationId = operation.operationId;
        result = await system.save();
      }
      await recordAudit({
        actorUserId: actor.id,
        action: "SYSTEM_RETIRED",
        entityType: "InstalledSystem",
        entityId: result._id,
        requestId,
        operationId: operation.operationId,
      });
      await appendOrderTimeline({
        orderId: order._id,
        actorUserId: actor.id,
        action: "SYSTEM_RETIRED",
        operationId: operation.operationId,
        metadata: { systemId: String(result._id) },
      });
    } else {
      if (
        system.status !== "ACTIVE" &&
        system.removedOperationId !== operation.operationId
      )
        throw new AppError(
          "SYNC_CONFLICT",
          "El sistema ya fue reemplazado.",
          409,
        );
      const replacementData = systemSchema
        .omit({ installationId: true })
        .parse(changes);
      if (system.removedOperationId !== operation.operationId) {
        system.status = "REPLACED";
        system.retiredAt = new Date();
        system.removedByServiceOrderId = order._id;
        system.removedOperationId = operation.operationId;
        await system.save();
      }
      result = await InstalledSystem.create({
        ...replacementData,
        operationId: operation.operationId,
        installationId: system.installationId,
        installedByServiceOrderId: order._id,
      });
      await recordAudit({
        actorUserId: actor.id,
        action: "SYSTEM_REPLACED",
        entityType: "InstalledSystem",
        entityId: system._id,
        requestId,
        operationId: operation.operationId,
        metadata: { replacementId: String(result._id) },
      });
      await appendOrderTimeline({
        orderId: order._id,
        actorUserId: actor.id,
        action: "SYSTEM_REPLACED",
        operationId: operation.operationId,
        metadata: {
          systemId: String(system._id),
          replacementId: String(result._id),
        },
      });
    }
  }
  if (existingSystem)
    await recordAudit({
      actorUserId: actor.id,
      action:
        operation.kind === "ADD_SYSTEM" ? "SYSTEM_ADDED" : "SYSTEM_REPLACED",
      entityType: "InstalledSystem",
      entityId:
        operation.kind === "ADD_SYSTEM"
          ? existingSystem._id
          : operation.entityId,
      requestId,
      operationId: operation.operationId,
      metadata:
        operation.kind === "REPLACE_SYSTEM"
          ? { replacementId: String(existingSystem._id) }
          : undefined,
    });
  stored.result = { id: String(result._id), status: result.status };
  stored.processedAt = new Date();
  await stored.save();
  return NextResponse.json({ duplicate: false, result: stored.result });
});
