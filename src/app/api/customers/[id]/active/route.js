import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDatabase } from "@/lib/db/mongoose";
import { AppError } from "@/lib/errors/app-error";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { objectId, parseJson } from "@/lib/validation/request";
import { recordAudit } from "@/modules/audit/audit.service";
import { Customer } from "@/modules/customers/customer.model";
export const PATCH = withApiHandler(
  async (request, { params }, { requestId }) => {
    const actor = await requireUser(["OWNER", "ADMIN"]);
    const { id } = await params;
    objectId(id);
    const { active } = await parseJson(
      request,
      z.object({ active: z.boolean() }),
    );
    await connectDatabase();
    const item = await Customer.findByIdAndUpdate(
      id,
      { $set: { active, updatedBy: actor.id } },
      { returnDocument: "after" },
    );
    if (!item)
      throw new AppError("CUSTOMER_NOT_FOUND", "Cliente no encontrado.", 404);
    await recordAudit({
      actorUserId: actor.id,
      action: active ? "CUSTOMER_REACTIVATED" : "CUSTOMER_DEACTIVATED",
      entityType: "Customer",
      entityId: item._id,
      requestId,
    });
    return NextResponse.json({ item });
  },
);
