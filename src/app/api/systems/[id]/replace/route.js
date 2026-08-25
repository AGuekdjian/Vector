import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongoose";
import { AppError } from "@/lib/errors/app-error";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { objectId, parseJson } from "@/lib/validation/request";
import { recordAudit } from "@/modules/audit/audit.service";
import { ServiceOrder } from "@/modules/service-orders/service-order.model";
import { InstalledSystem } from "@/modules/systems/installed-system.model";
import { systemSchema } from "@/modules/systems/system.schemas";
export const POST = withApiHandler(
  async (request, { params }, { requestId }) => {
    const actor = await requireUser();
    const { id } = await params;
    objectId(id);
    const data = await parseJson(
      request,
      systemSchema.omit({ installationId: true }),
    );
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
    const session = await mongoose.startSession();
    let replacement;
    try {
      await session.withTransaction(async () => {
        const previous = await InstalledSystem.findOneAndUpdate(
          {
            _id: id,
            installationId: order.installationId,
            status: "ACTIVE",
            active: true,
          },
          {
            $set: {
              status: "REPLACED",
              retiredAt: new Date(),
              removedByServiceOrderId: order._id,
            },
          },
          { returnDocument: "after", session },
        );
        if (!previous)
          throw new AppError(
            "SYSTEM_NOT_FOUND",
            "Sistema activo no encontrado.",
            404,
          );
        [replacement] = await InstalledSystem.create(
          [
            {
              ...data,
              installationId: order.installationId,
              installedByServiceOrderId: order._id,
              status: "ACTIVE",
            },
          ],
          { session },
        );
        await recordAudit(
          {
            actorUserId: actor.id,
            action: "SYSTEM_REPLACED",
            entityType: "InstalledSystem",
            entityId: previous._id,
            requestId,
            metadata: {
              replacementId: String(replacement._id),
              serviceOrderId: orderId,
            },
          },
          session,
        );
      });
    } finally {
      await session.endSession();
    }
    return NextResponse.json({ item: replacement }, { status: 201 });
  },
);
