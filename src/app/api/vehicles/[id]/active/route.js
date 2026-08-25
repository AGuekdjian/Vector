import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDatabase } from "@/lib/db/mongoose";
import { AppError } from "@/lib/errors/app-error";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { objectId, parseJson } from "@/lib/validation/request";
import { Vehicle } from "@/modules/vehicles/vehicle.model";
import { recordAudit } from "@/modules/audit/audit.service";
export const PATCH = withApiHandler(
  async (request, { params }, { requestId }) => {
    const actor = await requireUser(["OWNER", "ADMIN"]);
    const { id } = await params;
    objectId(id);
    const { active } = await parseJson(
      request,
      z.object({ active: z.boolean() }),
    );
    await connectDatabase();
    const item = await Vehicle.findByIdAndUpdate(
      id,
      { $set: { active } },
      { returnDocument: "after" },
    );
    if (!item)
      throw new AppError("VEHICLE_NOT_FOUND", "Vehículo no encontrado.", 404);
    await recordAudit({
      actorUserId: actor.id,
      action: active ? "VEHICLE_REACTIVATED" : "VEHICLE_DEACTIVATED",
      entityType: "Vehicle",
      entityId: item._id,
      requestId,
    });
    return NextResponse.json({ item });
  },
);
