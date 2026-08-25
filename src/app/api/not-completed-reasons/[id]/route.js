import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDatabase } from "@/lib/db/mongoose";
import { AppError } from "@/lib/errors/app-error";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { objectId, parseJson } from "@/lib/validation/request";
import { recordAudit } from "@/modules/audit/audit.service";
import { NotCompletedReason } from "@/modules/service-orders/not-completed-reason.model";
export const PATCH = withApiHandler(
  async (request, { params }, { requestId }) => {
    const actor = await requireUser(["OWNER", "ADMIN"]);
    const { id } = await params;
    objectId(id);
    const data = await parseJson(
      request,
      z.object({
        label: z.string().trim().min(3).max(200).optional(),
        sortOrder: z.number().int().optional(),
        active: z.boolean().optional(),
      }),
    );
    await connectDatabase();
    const item = await NotCompletedReason.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    );
    if (!item)
      throw new AppError("REASON_NOT_FOUND", "Motivo no encontrado.", 404);
    await recordAudit({
      actorUserId: actor.id,
      action: "NOT_COMPLETED_REASON_UPDATED",
      entityType: "NotCompletedReason",
      entityId: item._id,
      requestId,
      metadata: data,
    });
    return NextResponse.json({ item });
  },
);
