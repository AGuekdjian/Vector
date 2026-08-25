import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDatabase } from "@/lib/db/mongoose";
import { AppError } from "@/lib/errors/app-error";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { objectId, parseJson } from "@/lib/validation/request";
import { recordAudit } from "@/modules/audit/audit.service";
import { InstalledSystem } from "@/modules/systems/installed-system.model";

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
    const item = await InstalledSystem.findOneAndUpdate(
      { _id: id },
      { $set: { active } },
      { returnDocument: "after" },
    );
    if (!item)
      throw new AppError("SYSTEM_NOT_FOUND", "Sistema no encontrado.", 404);
    await recordAudit({
      actorUserId: actor.id,
      action: active ? "SYSTEM_REACTIVATED" : "SYSTEM_DEACTIVATED",
      entityType: "InstalledSystem",
      entityId: item._id,
      requestId,
    });
    return NextResponse.json({ item });
  },
);
