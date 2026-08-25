import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongoose";
import { AppError } from "@/lib/errors/app-error";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import {
  objectId,
  pagination,
  parseJson,
  safeRegex,
} from "@/lib/validation/request";
import { recordAudit } from "@/modules/audit/audit.service";
import { orderCreateSchema } from "@/modules/service-orders/order.schemas";
import { ServiceOrder } from "@/modules/service-orders/service-order.model";
import { Installation } from "@/modules/installations/installation.model";
import { User } from "@/modules/users/user.model";
import { Customer } from "@/modules/customers/customer.model";
import { Employee } from "@/modules/employees/employee.model";
import { Vehicle } from "@/modules/vehicles/vehicle.model";
export const GET = withApiHandler(async (request) => {
  const actor = await requireUser();
  await connectDatabase();
  const url = new URL(request.url);
  const { page, limit, skip } = pagination(url.searchParams);
  const filter = { active: true };
  if (actor.role === "TECHNICIAN") filter.responsibleTechnicianId = actor.id;
  else {
    const technicianId = url.searchParams.get("technicianId");
    if (technicianId) filter.responsibleTechnicianId = technicianId;
    const customerId = url.searchParams.get("customerId");
    if (customerId) filter.customerId = objectId(customerId, "cliente");
  }
  const status = url.searchParams.get("status");
  if (status) filter.status = status;
  const dateFrom = url.searchParams.get("dateFrom");
  const dateTo = url.searchParams.get("dateTo");
  if (dateFrom || dateTo) {
    filter.scheduledDate = {};
    if (dateFrom) {
      const value = new Date(`${dateFrom}T00:00:00.000Z`);
      if (Number.isNaN(value.valueOf()))
        throw new AppError("VALIDATION_ERROR", "Fecha inicial inválida.", 400);
      filter.scheduledDate.$gte = value;
    }
    if (dateTo) {
      const value = new Date(`${dateTo}T23:59:59.999Z`);
      if (Number.isNaN(value.valueOf()))
        throw new AppError("VALIDATION_ERROR", "Fecha final inválida.", 400);
      filter.scheduledDate.$lte = value;
    }
  }
  const number = safeRegex(url.searchParams.get("number") || "");
  if (number) filter.externalOrderNumber = { $regex: number, $options: "i" };
  const [items, total] = await Promise.all([
    ServiceOrder.find(filter)
      .select(actor.role === "TECHNICIAN" ? "-internalNote" : "+internalNote")
      .sort({ scheduledDate: -1, scheduledTime: 1 })
      .skip(skip)
      .limit(limit)
      .populate(
        "customerId",
        "customerType firstName lastName companyName primaryPhone secondaryPhone subscriber",
      )
      .populate("installationId", "name address department")
      .lean(),
    ServiceOrder.countDocuments(filter),
  ]);
  return NextResponse.json({ items, page, limit, total });
});
export const POST = withApiHandler(async (request, _context, { requestId }) => {
  const actor = await requireUser(["OWNER", "ADMIN"]);
  const data = await parseJson(request, orderCreateSchema);
  await connectDatabase();
  if (!(await Customer.exists({ _id: data.customerId, active: true })))
    throw new AppError(
      "CUSTOMER_NOT_FOUND",
      "Cliente no encontrado o inactivo.",
      400,
    );
  const installation = await Installation.exists({
    _id: data.installationId,
    customerId: data.customerId,
    active: true,
  });
  if (!installation)
    throw new AppError(
      "INSTALLATION_NOT_FOUND",
      "La instalación no pertenece al cliente.",
      400,
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
    data.companionEmployeeId &&
    !(await Employee.exists({ _id: data.companionEmployeeId, active: true }))
  )
    throw new AppError("EMPLOYEE_NOT_FOUND", "Compañero no válido.", 400);
  if (
    data.vehicleId &&
    !(await Vehicle.exists({ _id: data.vehicleId, active: true }))
  )
    throw new AppError("VEHICLE_NOT_FOUND", "Vehículo no válido.", 400);
  if (
    data.parentServiceOrderId &&
    !(await ServiceOrder.exists({
      _id: data.parentServiceOrderId,
      active: true,
    }))
  )
    throw new AppError(
      "PARENT_ORDER_NOT_FOUND",
      "Orden relacionada no encontrada.",
      400,
    );
  try {
    const status = data.responsibleTechnicianId ? "ASSIGNED" : "PENDING";
    const item = await ServiceOrder.create({
      ...data,
      status,
      createdBy: actor.id,
      updatedBy: actor.id,
      timeline: [
        { action: "ORDER_CREATED", actorUserId: actor.id },
        ...(status === "ASSIGNED"
          ? [{ action: "ORDER_ASSIGNED", actorUserId: actor.id }]
          : []),
      ],
    });
    await recordAudit({
      actorUserId: actor.id,
      action: "ORDER_CREATED",
      entityType: "ServiceOrder",
      entityId: item._id,
      requestId,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error?.code === 11000)
      throw new AppError(
        "DUPLICATE_ORDER_NUMBER",
        "Ya existe una orden con ese número.",
        409,
      );
    throw error;
  }
});
