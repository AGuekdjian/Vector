import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongoose";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { objectId, parseJson } from "@/lib/validation/request";
import { recordAudit } from "@/modules/audit/audit.service";
import { InstalledSystem } from "@/modules/systems/installed-system.model";
import { systemSchema } from "@/modules/systems/system.schemas";
import { ServiceOrder } from "@/modules/service-orders/service-order.model";
import { AppError } from "@/lib/errors/app-error";
export const GET = withApiHandler(async (request) => {
  await requireUser(["OWNER", "ADMIN"]);
  const url = new URL(request.url);
  const installationId = objectId(
    url.searchParams.get("installationId"),
    "instalación",
  );
  await connectDatabase();
  return NextResponse.json({
    items: await InstalledSystem.find({
      installationId,
      ...(url.searchParams.get("includeInactive") === "true"
        ? {}
        : { active: true }),
    })
      .sort({ createdAt: -1 })
      .lean(),
  });
});
export const POST = withApiHandler(async (request, _context, { requestId }) => {
  const actor = await requireUser();
  const data = await parseJson(request, systemSchema);
  await connectDatabase();
  let installedByServiceOrderId;
  if (actor.role === "TECHNICIAN") {
    installedByServiceOrderId = objectId(
      new URL(request.url).searchParams.get("serviceOrderId"),
      "orden",
    );
    const allowed = await ServiceOrder.exists({
      _id: installedByServiceOrderId,
      installationId: data.installationId,
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
  const item = await InstalledSystem.create({
    ...data,
    installedByServiceOrderId,
  });
  await recordAudit({
    actorUserId: actor.id,
    action: "SYSTEM_ADDED",
    entityType: "InstalledSystem",
    entityId: item._id,
    requestId,
  });
  return NextResponse.json({ item }, { status: 201 });
});
