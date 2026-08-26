import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongoose";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { pagination, safeRegex } from "@/lib/validation/request";
import { AuditEvent } from "@/modules/audit/audit.model";
export const GET = withApiHandler(async (request) => {
  await requireUser(["OWNER"]);
  await connectDatabase();
  const params = new URL(request.url).searchParams;
  const { page, limit, skip } = pagination(params);
  const filter = {};
  const entityType = params.get("entityType");
  if (entityType) filter.entityType = entityType;
  const q = safeRegex(params.get("q") || "");
  if (q)
    filter.$or = ["action", "requestId"].map((field) => ({
      [field]: { $regex: q, $options: "i" },
    }));
  const [items, total] = await Promise.all([
    AuditEvent.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("actorUserId", "username role")
      .lean(),
    AuditEvent.countDocuments(filter),
  ]);
  return NextResponse.json({ items, total, page, limit });
});
