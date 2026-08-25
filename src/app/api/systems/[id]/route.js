import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongoose";
import { AppError } from "@/lib/errors/app-error";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { objectId, parseJson } from "@/lib/validation/request";
import { recordAudit } from "@/modules/audit/audit.service";
import { ServiceOrder } from "@/modules/service-orders/service-order.model";
import { InstalledSystem } from "@/modules/systems/installed-system.model";
import { systemUpdateSchema } from "@/modules/systems/system.schemas";
export const PATCH = withApiHandler(
  async (request, { params }, { requestId }) => {
    const actor = await requireUser();
    const { id } = await params;
    objectId(id);
    const data = await parseJson(request, systemUpdateSchema);
    await connectDatabase();
    const current = await InstalledSystem.findById(id);
    if (!current)
      throw new AppError("SYSTEM_NOT_FOUND", "Sistema no encontrado.", 404);
    if (actor.role === "TECHNICIAN") {
      const orderId = objectId(
        new URL(request.url).searchParams.get("serviceOrderId"),
        "orden",
      );
      const allowed = await ServiceOrder.exists({
        _id: orderId,
        installationId: current.installationId,
        responsibleTechnicianId: actor.id,
        active: true,
        status: { $in: ["ASSIGNED", "IN_PROGRESS"] },
      });
      if (!allowed)
        throw new AppError(
          "ORDER_NOT_ASSIGNED",
          "No tienes acceso a esta orden.",
          403,
        );
    }
    Object.assign(current, data);
    await current.save();
    await recordAudit({
      actorUserId: actor.id,
      action: "SYSTEM_UPDATED",
      entityType: "InstalledSystem",
      entityId: current._id,
      requestId,
      metadata: { fields: Object.keys(data) },
    });
    return NextResponse.json({ item: current });
  },
);
