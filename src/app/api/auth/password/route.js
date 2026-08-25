import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDatabase } from "@/lib/db/mongoose";
import { AppError } from "@/lib/errors/app-error";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { parseJson } from "@/lib/validation/request";
import { recordAudit } from "@/modules/audit/audit.service";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
} from "@/modules/auth/session";
import { User } from "@/modules/users/user.model";
import {
  ADMIN_PASSWORD_PATTERN,
  TECHNICIAN_PIN_PATTERN,
} from "@/modules/auth/auth.schemas";

const schema = z.object({
  currentPassword: z.string().min(4).max(128),
  newPassword: z.string().min(4).max(128),
});
export const POST = withApiHandler(async (request, _context, { requestId }) => {
  const actor = await requireUser();
  const data = await parseJson(request, schema);
  if (
    actor.role === "TECHNICIAN" &&
    !TECHNICIAN_PIN_PATTERN.test(data.newPassword)
  )
    throw new AppError(
      "INVALID_PIN",
      "El PIN técnico debe tener exactamente 4 dígitos.",
      400,
    );
  if (
    actor.role !== "TECHNICIAN" &&
    !ADMIN_PASSWORD_PATTERN.test(data.newPassword)
  )
    throw new AppError(
      "WEAK_PASSWORD",
      "La contraseña debe tener al menos 10 caracteres, mayúscula, minúscula, número y símbolo.",
      400,
    );
  await connectDatabase();
  const user = await User.findById(actor.id).select(
    "+passwordHash +sessionVersion",
  );
  if (!user || !(await bcrypt.compare(data.currentPassword, user.passwordHash)))
    throw new AppError(
      "INVALID_CREDENTIALS",
      "La contraseña actual no es correcta.",
      401,
    );
  user.passwordHash = await bcrypt.hash(data.newPassword, 12);
  user.sessionVersion += 1;
  await user.save();
  const token = await signSession({
    userId: String(user._id),
    role: user.role,
    sessionVersion: user.sessionVersion,
  });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  await recordAudit({
    actorUserId: user._id,
    action: "PASSWORD_CHANGED",
    entityType: "User",
    entityId: user._id,
    requestId,
  });
  return response;
});
