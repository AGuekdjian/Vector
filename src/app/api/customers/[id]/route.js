import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongoose";
import { AppError } from "@/lib/errors/app-error";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { objectId, parseJson } from "@/lib/validation/request";
import { recordAudit } from "@/modules/audit/audit.service";
import { Customer } from "@/modules/customers/customer.model";
import { customerUpdateSchema } from "@/modules/customers/customer.schemas";

export const GET = withApiHandler(async (_request, { params }) => {
  await requireUser(["OWNER", "ADMIN"]);
  const { id } = await params;
  objectId(id);
  await connectDatabase();
  const item = await Customer.findById(id).lean();
  if (!item)
    throw new AppError("CUSTOMER_NOT_FOUND", "Cliente no encontrado.", 404);
  return NextResponse.json({ item });
});
export const PATCH = withApiHandler(
  async (request, { params }, { requestId }) => {
    const actor = await requireUser(["OWNER", "ADMIN"]);
    const { id } = await params;
    objectId(id);
    const data = await parseJson(request, customerUpdateSchema);
    await connectDatabase();
    const item = await Customer.findByIdAndUpdate(
      id,
      { $set: { ...data, updatedBy: actor.id } },
      { new: true, runValidators: true },
    );
    if (!item)
      throw new AppError("CUSTOMER_NOT_FOUND", "Cliente no encontrado.", 404);
    await recordAudit({
      actorUserId: actor.id,
      action: "CUSTOMER_UPDATED",
      entityType: "Customer",
      entityId: item._id,
      requestId,
      metadata: { fields: Object.keys(data) },
    });
    return NextResponse.json({ item });
  },
);
