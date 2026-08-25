import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDatabase } from "@/lib/db/mongoose";
import { AppError } from "@/lib/errors/app-error";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { objectId, parseJson } from "@/lib/validation/request";
import { recordAudit } from "@/modules/audit/audit.service";
import { Employee } from "@/modules/employees/employee.model";
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
    const item = await Employee.findByIdAndUpdate(
      id,
      { $set: { active } },
      { new: true },
    );
    if (!item)
      throw new AppError("EMPLOYEE_NOT_FOUND", "Empleado no encontrado.", 404);
    await recordAudit({
      actorUserId: actor.id,
      action: active ? "EMPLOYEE_REACTIVATED" : "EMPLOYEE_DEACTIVATED",
      entityType: "Employee",
      entityId: item._id,
      requestId,
    });
    return NextResponse.json({ item });
  },
);
