import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongoose";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { pagination, parseJson, safeRegex } from "@/lib/validation/request";
import { recordAudit } from "@/modules/audit/audit.service";
import { Customer } from "@/modules/customers/customer.model";
import { customerSchema } from "@/modules/customers/customer.schemas";

export const GET = withApiHandler(async (request) => {
  await requireUser(["OWNER", "ADMIN"]);
  await connectDatabase();
  const url = new URL(request.url);
  const { page, limit, skip } = pagination(url.searchParams);
  const q = safeRegex(url.searchParams.get("q") || "");
  const filter = { active: url.searchParams.get("active") !== "false" };
  if (q)
    filter.$or = [
      "firstName",
      "lastName",
      "companyName",
      "customerNumber",
      "subscriberNumber",
      "primaryPhone",
      "address",
    ].map((field) => ({ [field]: { $regex: q, $options: "i" } }));
  const [items, total] = await Promise.all([
    Customer.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Customer.countDocuments(filter),
  ]);
  return NextResponse.json({ items, page, limit, total });
});
export const POST = withApiHandler(async (request, _context, { requestId }) => {
  const actor = await requireUser(["OWNER", "ADMIN"]);
  const data = await parseJson(request, customerSchema);
  await connectDatabase();
  const customer = await Customer.create({
    ...data,
    createdBy: actor.id,
    updatedBy: actor.id,
  });
  await recordAudit({
    actorUserId: actor.id,
    action: "CUSTOMER_CREATED",
    entityType: "Customer",
    entityId: customer._id,
    requestId,
  });
  return NextResponse.json({ item: customer }, { status: 201 });
});
