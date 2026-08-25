import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongoose";
import { AppError } from "@/lib/errors/app-error";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { parseJson } from "@/lib/validation/request";
import { recordAudit } from "@/modules/audit/audit.service";
import { createUserSchema } from "@/modules/auth/auth.schemas";
import { generateUniqueUsername } from "@/modules/auth/username";
import { Employee } from "@/modules/employees/employee.model";
import { User } from "@/modules/users/user.model";
export const GET = withApiHandler(async () => {
  await requireUser(["OWNER", "ADMIN"]);
  await connectDatabase();
  return NextResponse.json({
    items: await User.find({})
      .populate("employeeId", "firstName lastName active")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
  });
});
export const POST = withApiHandler(async (request, _context, { requestId }) => {
  const actor = await requireUser(["OWNER", "ADMIN"]);
  const data = await parseJson(request, createUserSchema);
  if (data.role === "ADMIN" && actor.role !== "OWNER")
    throw new AppError(
      "FORBIDDEN",
      "Solo OWNER puede crear administradores.",
      403,
    );
  await connectDatabase();
  const employee = await Employee.findOne({
    _id: data.employeeId,
    active: true,
  });
  if (!employee)
    throw new AppError("EMPLOYEE_NOT_FOUND", "Empleado no encontrado.", 404);
  if (await User.exists({ employeeId: employee._id }))
    throw new AppError(
      "EMPLOYEE_HAS_USER",
      "El empleado ya tiene usuario.",
      409,
    );
  const username = await generateUniqueUsername(
    employee.firstName,
    employee.lastName,
    (candidate) => User.exists({ username: candidate }),
  );
  const item = await User.create({
    employeeId: employee._id,
    username,
    passwordHash: await bcrypt.hash(data.password, 12),
    role: data.role,
  });
  await recordAudit({
    actorUserId: actor.id,
    action: "USER_CREATED",
    entityType: "User",
    entityId: item._id,
    requestId,
    metadata: { role: item.role },
  });
  return NextResponse.json(
    {
      item: {
        id: String(item._id),
        username: item.username,
        role: item.role,
        active: item.active,
      },
    },
    { status: 201 },
  );
});
