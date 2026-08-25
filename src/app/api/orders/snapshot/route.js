import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongoose";
import { AppError } from "@/lib/errors/app-error";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { ServiceOrder } from "@/modules/service-orders/service-order.model";
import { InstalledSystem } from "@/modules/systems/installed-system.model";
import {
  TECHNICIAN_CUSTOMER_PROJECTION,
  TECHNICIAN_ORDER_PROJECTION,
} from "@/modules/service-orders/order.visibility";

export const GET = withApiHandler(async (request) => {
  const actor = await requireUser(["TECHNICIAN"]);
  const date = new URL(request.url).searchParams.get("date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || ""))
    throw new AppError("VALIDATION_ERROR", "La fecha no es válida.", 400);
  const from = new Date(`${date}T00:00:00.000Z`);
  const to = new Date(`${date}T23:59:59.999Z`);
  await connectDatabase();
  const orders = await ServiceOrder.find({
    responsibleTechnicianId: actor.id,
    active: true,
    scheduledDate: { $gte: from, $lte: to },
  })
    .select(TECHNICIAN_ORDER_PROJECTION)
    .sort({ scheduledTime: 1, sequence: 1 })
    .limit(100)
    .populate("customerId", TECHNICIAN_CUSTOMER_PROJECTION)
    .populate("installationId", "name address department")
    .populate("companionEmployeeId", "firstName lastName")
    .populate("vehicleId", "plate")
    .lean();
  const installationIds = [
    ...new Set(orders.map((order) => String(order.installationId?._id))),
  ];
  const [systems, history] = await Promise.all([
    InstalledSystem.find({
      installationId: { $in: installationIds },
      active: true,
    }).lean(),
    ServiceOrder.find({
      installationId: { $in: installationIds },
      active: true,
      status: { $in: ["COMPLETED", "REQUIRES_QUOTE", "NOT_COMPLETED"] },
    })
      .select(
        "installationId externalOrderNumber scheduledDate status completionResult technicianObservation quoteDetails completedAt",
      )
      .sort({ completedAt: -1 })
      .limit(500)
      .lean(),
  ]);
  const byInstallation = (items) =>
    items.reduce((map, item) => {
      const key = String(item.installationId);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
      return map;
    }, new Map());
  const systemsByInstallation = byInstallation(systems);
  const historyByInstallation = byInstallation(history);
  return NextResponse.json({
    items: orders.map((order) => ({
      ...order,
      systems:
        systemsByInstallation.get(String(order.installationId?._id)) || [],
      technicalHistory: (
        historyByInstallation.get(String(order.installationId?._id)) || []
      )
        .filter((entry) => String(entry._id) !== String(order._id))
        .slice(0, 10),
    })),
  });
});
