import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongoose";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { objectId, parseJson } from "@/lib/validation/request";
import { recordAudit } from "@/modules/audit/audit.service";
import { Installation } from "@/modules/installations/installation.model";
import { installationSchema } from "@/modules/installations/installation.schemas";
export const GET = withApiHandler(async (request) => {
  await requireUser(["OWNER", "ADMIN"]);
  const customerId = objectId(
    new URL(request.url).searchParams.get("customerId"),
    "cliente",
  );
  await connectDatabase();
  return NextResponse.json({
    items: await Installation.find({ customerId, active: true })
      .sort({ name: 1 })
      .lean(),
  });
});
export const POST = withApiHandler(async (request, _context, { requestId }) => {
  const actor = await requireUser(["OWNER", "ADMIN"]);
  const data = await parseJson(request, installationSchema);
  await connectDatabase();
  const item = await Installation.create(data);
  await recordAudit({
    actorUserId: actor.id,
    action: "INSTALLATION_CREATED",
    entityType: "Installation",
    entityId: item._id,
    requestId,
  });
  return NextResponse.json({ item }, { status: 201 });
});
