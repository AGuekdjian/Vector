import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDatabase } from "@/lib/db/mongoose";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { parseJson } from "@/lib/validation/request";
import { recordAudit } from "@/modules/audit/audit.service";
import { NotCompletedReason } from "@/modules/service-orders/not-completed-reason.model";
export const GET = withApiHandler(async (request) => {
  const actor = await requireUser();
  await connectDatabase();
  const includeInactive =
    new URL(request.url).searchParams.get("includeInactive") === "true" &&
    ["OWNER", "ADMIN"].includes(actor.role);
  return NextResponse.json({
    items: await NotCompletedReason.find(
      includeInactive ? {} : { active: true },
    )
      .sort({ active: -1, sortOrder: 1, label: 1 })
      .lean(),
  });
});
export const POST = withApiHandler(async (request, _context, { requestId }) => {
  const actor = await requireUser(["OWNER", "ADMIN"]);
  const data = await parseJson(
    request,
    z.object({
      label: z.string().trim().min(3).max(200),
      sortOrder: z.number().int().optional(),
    }),
  );
  await connectDatabase();
  const item = await NotCompletedReason.create(data);
  await recordAudit({
    actorUserId: actor.id,
    action: "NOT_COMPLETED_REASON_CREATED",
    entityType: "NotCompletedReason",
    entityId: item._id,
    requestId,
  });
  return NextResponse.json({ item }, { status: 201 });
});
