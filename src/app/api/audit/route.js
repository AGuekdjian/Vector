import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongoose";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { pagination } from "@/lib/validation/request";
import { AuditEvent } from "@/modules/audit/audit.model";
export const GET = withApiHandler(async (request) => {
  await requireUser(["OWNER"]);
  await connectDatabase();
  const { page, limit, skip } = pagination(new URL(request.url).searchParams);
  const [items, total] = await Promise.all([
    AuditEvent.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("actorUserId", "username role")
      .lean(),
    AuditEvent.countDocuments(),
  ]);
  return NextResponse.json({ items, total, page, limit });
});
