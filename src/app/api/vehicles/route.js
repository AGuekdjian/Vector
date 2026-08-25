import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDatabase } from "@/lib/db/mongoose";
import { AppError } from "@/lib/errors/app-error";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { parseJson } from "@/lib/validation/request";
import { recordAudit } from "@/modules/audit/audit.service";
import { Vehicle } from "@/modules/vehicles/vehicle.model";
export const GET = withApiHandler(async () => {
  await requireUser(["OWNER", "ADMIN"]);
  await connectDatabase();
  return NextResponse.json({
    items: await Vehicle.find({}).sort({ active: -1, plate: 1 }).lean(),
  });
});
export const POST = withApiHandler(async (request, _context, { requestId }) => {
  const actor = await requireUser(["OWNER", "ADMIN"]);
  const data = await parseJson(
    request,
    z.object({ plate: z.string().trim().min(3).max(20) }),
  );
  await connectDatabase();
  try {
    const item = await Vehicle.create(data);
    await recordAudit({
      actorUserId: actor.id,
      action: "VEHICLE_CREATED",
      entityType: "Vehicle",
      entityId: item._id,
      requestId,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error?.code === 11000)
      throw new AppError("DUPLICATE_VEHICLE", "La matrícula ya existe.", 409);
    throw error;
  }
});
