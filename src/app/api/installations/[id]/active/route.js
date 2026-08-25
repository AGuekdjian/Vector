import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDatabase } from "@/lib/db/mongoose";
import { AppError } from "@/lib/errors/app-error";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { objectId, parseJson } from "@/lib/validation/request";
import { Installation } from "@/modules/installations/installation.model";
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
    const item = await Installation.findByIdAndUpdate(
      id,
      { $set: { active } },
      { new: true },
    );
    if (!item)
      throw new AppError(
        "INSTALLATION_NOT_FOUND",
        "Instalación no encontrada.",
        404,
      );
    await recordAudit({
      actorUserId: actor.id,
      action: active ? "INSTALLATION_REACTIVATED" : "INSTALLATION_DEACTIVATED",
      entityType: "Installation",
      entityId: item._id,
      requestId,
    });
    return NextResponse.json({ item });
  },
);
