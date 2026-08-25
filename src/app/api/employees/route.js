import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDatabase } from "@/lib/db/mongoose";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { pagination, parseJson } from "@/lib/validation/request";
import { recordAudit } from "@/modules/audit/audit.service";
import { Employee } from "@/modules/employees/employee.model";
const schema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
});
export const GET = withApiHandler(async (request) => {
  await requireUser(["OWNER", "ADMIN"]);
  await connectDatabase();
  const { page, limit, skip } = pagination(new URL(request.url).searchParams);
  const filter = {};
  const [items, total] = await Promise.all([
    Employee.find(filter)
      .sort({ active: -1, lastName: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Employee.countDocuments(filter),
  ]);
  return NextResponse.json({ items, page, limit, total });
});
export const POST = withApiHandler(async (request, _context, { requestId }) => {
  const actor = await requireUser(["OWNER", "ADMIN"]);
  const data = await parseJson(request, schema);
  await connectDatabase();
  const item = await Employee.create(data);
  await recordAudit({
    actorUserId: actor.id,
    action: "EMPLOYEE_CREATED",
    entityType: "Employee",
    entityId: item._id,
    requestId,
  });
  return NextResponse.json({ item }, { status: 201 });
});
