import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongoose";
import { AppError } from "@/lib/errors/app-error";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { objectId, parseJson } from "@/lib/validation/request";
import { recordAudit } from "@/modules/audit/audit.service";
import { Installation } from "@/modules/installations/installation.model";
import { installationSchema } from "@/modules/installations/installation.schemas";

export const PATCH = withApiHandler(
  async (request, { params }, { requestId }) => {
    const actor = await requireUser(["OWNER", "ADMIN"]);
    const { id } = await params;
    objectId(id);
    const data = await parseJson(
      request,
      installationSchema.omit({ customerId: true }).partial(),
    );
    await connectDatabase();
    const item = await Installation.findOneAndUpdate(
      { _id: id },
      { $set: data },
      { returnDocument: "after", runValidators: true },
    );
    if (!item)
      throw new AppError(
        "INSTALLATION_NOT_FOUND",
        "Instalación no encontrada.",
        404,
      );
    await recordAudit({
      actorUserId: actor.id,
      action: "INSTALLATION_UPDATED",
      entityType: "Installation",
      entityId: item._id,
      requestId,
      metadata: { fields: Object.keys(data) },
    });
    return NextResponse.json({ item });
  },
);
