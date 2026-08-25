import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDatabase } from "@/lib/db/mongoose";
import { AppError } from "@/lib/errors/app-error";
import { withApiHandler } from "@/lib/http/api-handler";
import { assertOwnerProtected, requireUser } from "@/lib/permissions/authorize";
import { objectId, parseJson } from "@/lib/validation/request";
import { recordAudit } from "@/modules/audit/audit.service";
import { User } from "@/modules/users/user.model";
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
    const target = await User.findById(id).select("+sessionVersion");
    if (!target)
      throw new AppError("USER_NOT_FOUND", "Usuario no encontrado.", 404);
    assertOwnerProtected(actor, target);
    if (String(target._id) === actor.id && !active)
      throw new AppError(
        "FORBIDDEN",
        "No puedes desactivar tu propia cuenta.",
        403,
      );
    target.active = active;
    if (!active) target.sessionVersion += 1;
    await target.save();
    await recordAudit({
      actorUserId: actor.id,
      action: active ? "USER_REACTIVATED" : "USER_DEACTIVATED",
      entityType: "User",
      entityId: target._id,
      requestId,
    });
    return NextResponse.json({
      item: { id: String(target._id), active: target.active },
    });
  },
);
