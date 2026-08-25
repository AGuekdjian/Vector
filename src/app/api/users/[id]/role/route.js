import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDatabase } from "@/lib/db/mongoose";
import { AppError } from "@/lib/errors/app-error";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { objectId, parseJson } from "@/lib/validation/request";
import { recordAudit } from "@/modules/audit/audit.service";
import { User } from "@/modules/users/user.model";
export const PATCH = withApiHandler(
  async (request, { params }, { requestId }) => {
    const actor = await requireUser(["OWNER"]);
    const { id } = await params;
    objectId(id);
    const { role } = await parseJson(
      request,
      z.object({ role: z.enum(["ADMIN", "TECHNICIAN"]) }),
    );
    await connectDatabase();
    const target = await User.findById(id).select("+sessionVersion");
    if (!target)
      throw new AppError("USER_NOT_FOUND", "Usuario no encontrado.", 404);
    if (target.role === "OWNER")
      throw new AppError(
        "FORBIDDEN",
        "El rol OWNER no puede modificarse.",
        403,
      );
    target.role = role;
    target.sessionVersion += 1;
    await target.save();
    await recordAudit({
      actorUserId: actor.id,
      action: "USER_ROLE_CHANGED",
      entityType: "User",
      entityId: target._id,
      requestId,
      metadata: { role },
    });
    return NextResponse.json({ item: { id: String(target._id), role } });
  },
);
