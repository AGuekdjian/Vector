import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongoose";
import { AppError } from "@/lib/errors/app-error";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { objectId } from "@/lib/validation/request";
import { recordAudit } from "@/modules/audit/audit.service";
import { ServiceOrder } from "@/modules/service-orders/service-order.model";
import { InstalledSystem } from "@/modules/systems/installed-system.model";
export const POST = withApiHandler(
  async (request, { params }, { requestId }) => {
    const actor = await requireUser();
    const { id } = await params;
    objectId(id);
    const orderId = objectId(
      new URL(request.url).searchParams.get("serviceOrderId"),
      "orden",
    );
    await connectDatabase();
    const order = await ServiceOrder.findOne({
      _id: orderId,
      active: true,
      ...(actor.role === "TECHNICIAN"
        ? { responsibleTechnicianId: actor.id }
        : {}),
    });
    if (!order || !["ASSIGNED", "IN_PROGRESS"].includes(order.status))
      throw new AppError(
        "ORDER_NOT_ASSIGNED",
        "No tienes acceso a esta orden.",
        403,
      );
    const item = await InstalledSystem.findOneAndUpdate(
      {
        _id: id,
        installationId: order.installationId,
        status: "ACTIVE",
        active: true,
      },
      {
        $set: {
          status: "RETIRED",
          retiredAt: new Date(),
          removedByServiceOrderId: order._id,
        },
      },
      { returnDocument: "after" },
    );
    if (!item)
      throw new AppError(
        "SYSTEM_NOT_FOUND",
        "Sistema activo no encontrado.",
        404,
      );
    await recordAudit({
      actorUserId: actor.id,
      action: "SYSTEM_RETIRED",
      entityType: "InstalledSystem",
      entityId: item._id,
      requestId,
      metadata: { serviceOrderId: orderId },
    });
    return NextResponse.json({ item });
  },
);
