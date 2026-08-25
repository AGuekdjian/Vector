import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongoose";
import { AppError } from "@/lib/errors/app-error";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { objectId, parseJson } from "@/lib/validation/request";
import { ServiceOrder } from "@/modules/service-orders/service-order.model";
import { InstalledSystem } from "@/modules/systems/installed-system.model";
import { orderUpdateSchema } from "@/modules/service-orders/order.schemas";
import { recordAudit } from "@/modules/audit/audit.service";
import {
  TECHNICIAN_CUSTOMER_PROJECTION,
  TECHNICIAN_ORDER_PROJECTION,
} from "@/modules/service-orders/order.visibility";
import { User } from "@/modules/users/user.model";
import { Vehicle } from "@/modules/vehicles/vehicle.model";
import { Employee } from "@/modules/employees/employee.model";
export const GET = withApiHandler(async (_request, { params }) => {
  const actor = await requireUser();
  const { id } = await params;
  objectId(id);
  await connectDatabase();
  const filter = { _id: id, active: true };
  if (actor.role === "TECHNICIAN") filter.responsibleTechnicianId = actor.id;
  const item = await ServiceOrder.findOne(filter)
    .select(
      actor.role === "TECHNICIAN"
        ? TECHNICIAN_ORDER_PROJECTION
        : "+internalNote",
    )
    .populate(
      "customerId",
      actor.role === "TECHNICIAN" ? TECHNICIAN_CUSTOMER_PROJECTION : "-__v",
    )
    .populate("installationId", "name address department")
    .populate("companionEmployeeId", "firstName lastName")
    .populate("vehicleId", "plate")
    .lean();
  if (!item)
    throw new AppError(
      actor.role === "TECHNICIAN" ? "ORDER_NOT_ASSIGNED" : "ORDER_NOT_FOUND",
      "Orden no encontrada.",
      404,
    );
  const systems = await InstalledSystem.find({
    installationId: item.installationId._id,
    active: true,
  }).lean();
  const technicalHistory =
    actor.role === "TECHNICIAN"
      ? await ServiceOrder.find({
          _id: { $ne: item._id },
          installationId: item.installationId._id,
          active: true,
          status: { $in: ["COMPLETED", "REQUIRES_QUOTE", "NOT_COMPLETED"] },
        })
          .select(
            "externalOrderNumber scheduledDate status completionResult technicianObservation quoteDetails completedAt",
          )
          .sort({ completedAt: -1 })
          .limit(10)
          .lean()
      : [];
  return NextResponse.json({ item: { ...item, systems, technicalHistory } });
});
export const PATCH = withApiHandler(
  async (request, { params }, { requestId }) => {
    const actor = await requireUser(["OWNER", "ADMIN"]);
    const { id } = await params;
    objectId(id);
    const data = await parseJson(request, orderUpdateSchema);
    await connectDatabase();
    const current = await ServiceOrder.findOne({
      _id: id,
      active: true,
      status: { $in: ["PENDING", "ASSIGNED", "RESCHEDULED"] },
    });
    if (!current)
      throw new AppError(
        "INVALID_ORDER_STATE",
        "Una orden iniciada o finalizada no puede editarse.",
        409,
      );
    if (
      data.responsibleTechnicianId &&
      !(await User.exists({
        _id: data.responsibleTechnicianId,
        role: "TECHNICIAN",
        active: true,
      }))
    )
      throw new AppError("TECHNICIAN_NOT_FOUND", "Técnico no válido.", 400);
    if (
      data.vehicleId &&
      !(await Vehicle.exists({ _id: data.vehicleId, active: true }))
    )
      throw new AppError("VEHICLE_NOT_FOUND", "Vehículo no válido.", 400);
    if (
      data.companionEmployeeId &&
      !(await Employee.exists({ _id: data.companionEmployeeId, active: true }))
    )
      throw new AppError("EMPLOYEE_NOT_FOUND", "Compañero no válido.", 400);
    const changes = [];
    for (const field of [
      "responsibleTechnicianId",
      "vehicleId",
      "companionEmployeeId",
    ]) {
      if (
        Object.hasOwn(data, field) &&
        String(current[field] || "") !== String(data[field] || "")
      )
        changes.push(field);
    }
    Object.assign(current, data, {
      updatedBy: actor.id,
    });
    current.status = current.responsibleTechnicianId ? "ASSIGNED" : "PENDING";
    const timelineActions = {
      responsibleTechnicianId: current.timeline.some(
        (entry) => entry.action === "ORDER_ASSIGNED",
      )
        ? "TECHNICIAN_REASSIGNED"
        : "ORDER_ASSIGNED",
      vehicleId: "VEHICLE_CHANGED",
      companionEmployeeId: "COMPANION_CHANGED",
    };
    for (const field of changes)
      current.timeline.push({
        action:
          field === "responsibleTechnicianId" && !data[field]
            ? "TECHNICIAN_UNASSIGNED"
            : timelineActions[field],
        actorUserId: actor.id,
        metadata: { value: data[field] || null },
      });
    await current.save();
    await recordAudit({
      actorUserId: actor.id,
      action: "ORDER_UPDATED",
      entityType: "ServiceOrder",
      entityId: current._id,
      requestId,
      metadata: { fields: Object.keys(data) },
    });
    return NextResponse.json({ item: current });
  },
);
