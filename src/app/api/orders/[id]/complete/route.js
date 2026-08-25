import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongoose";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { objectId, parseJson } from "@/lib/validation/request";
import { completionSchema } from "@/modules/service-orders/order.schemas";
import { completeOrder } from "@/modules/service-orders/order.service";
import { NotCompletedReason } from "@/modules/service-orders/not-completed-reason.model";
import { AppError } from "@/lib/errors/app-error";
export const POST = withApiHandler(
  async (request, { params }, { requestId }) => {
    const actor = await requireUser();
    const { id } = await params;
    objectId(id);
    const data = await parseJson(request, completionSchema);
    await connectDatabase();
    if (
      data.result === "NOT_COMPLETED" &&
      !(await NotCompletedReason.exists({
        _id: data.notCompletedReasonId,
        active: true,
      }))
    )
      throw new AppError(
        "REASON_NOT_FOUND",
        "El motivo seleccionado no está disponible.",
        400,
      );
    return NextResponse.json({
      item: await completeOrder({ orderId: id, actor, data, requestId }),
    });
  },
);
