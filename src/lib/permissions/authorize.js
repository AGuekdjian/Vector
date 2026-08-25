import { AppError } from "@/lib/errors/app-error";
import { connectDatabase } from "@/lib/db/mongoose";
import { readSession } from "@/modules/auth/session";
import { User } from "@/modules/users/user.model";

export async function requireUser(allowedRoles) {
  const session = await readSession();
  if (!session?.userId)
    throw new AppError("UNAUTHORIZED", "Debes iniciar sesión.", 401);
  await connectDatabase();
  const user = await User.findOne({ _id: session.userId, active: true })
    .select("+sessionVersion")
    .lean();
  if (!user || user.sessionVersion !== session.sessionVersion)
    throw new AppError("UNAUTHORIZED", "La sesión no es válida.", 401);
  if (allowedRoles && !allowedRoles.includes(user.role))
    throw new AppError(
      "FORBIDDEN",
      "No tienes permiso para realizar esta acción.",
      403,
    );
  return {
    id: String(user._id),
    employeeId: String(user.employeeId),
    role: user.role,
    username: user.username,
  };
}

export function assertOwnerProtected(actor, target) {
  if (target.role === "OWNER" && actor.role !== "OWNER")
    throw new AppError(
      "FORBIDDEN",
      "Un administrador no puede modificar al propietario.",
      403,
    );
}
