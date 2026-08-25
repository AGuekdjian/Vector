import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongoose";
import { AppError } from "@/lib/errors/app-error";
import { withApiHandler } from "@/lib/http/api-handler";
import { recordAudit } from "@/modules/audit/audit.service";
import { loginSchema } from "@/modules/auth/auth.schemas";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
} from "@/modules/auth/session";
import { User } from "@/modules/users/user.model";
import {
  assertLoginAllowed,
  clearLoginFailures,
  recordLoginFailure,
} from "@/modules/auth/login-throttle.service";
import { parseJson } from "@/lib/validation/request";

const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("invalid-credential-padding", 12);

export const POST = withApiHandler(async (request, _context, { requestId }) => {
  const credentials = await parseJson(request, loginSchema);
  await connectDatabase();
  await assertLoginAllowed(request, credentials.username);
  const user = await User.findOne({ username: credentials.username }).select(
    "+passwordHash +failedLoginAttempts +lockedUntil +sessionVersion",
  );
  if (!user || !user.active) {
    await recordLoginFailure(request, credentials.username);
    await bcrypt.compare(credentials.password, DUMMY_PASSWORD_HASH);
    await recordAudit({
      action: "LOGIN_FAILED",
      entityType: "Authentication",
      requestId,
      metadata: { username: credentials.username },
    });
    throw new AppError(
      "INVALID_CREDENTIALS",
      "Usuario o contraseña incorrectos.",
      401,
    );
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await recordAudit({
      actorUserId: user._id,
      action: "LOGIN_BLOCKED",
      entityType: "User",
      entityId: user._id,
      requestId,
    });
    throw new AppError(
      "ACCOUNT_LOCKED",
      "Cuenta bloqueada temporalmente.",
      429,
    );
  }
  const valid = await bcrypt.compare(credentials.password, user.passwordHash);
  if (!valid) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= MAX_ATTEMPTS)
      user.lockedUntil = new Date(Date.now() + LOCK_MS);
    await user.save();
    await recordLoginFailure(request, credentials.username);
    await recordAudit({
      actorUserId: user._id,
      action: "LOGIN_FAILED",
      entityType: "User",
      entityId: user._id,
      requestId,
    });
    throw new AppError(
      "INVALID_CREDENTIALS",
      "Usuario o contraseña incorrectos.",
      401,
    );
  }
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  user.lastLoginAt = new Date();
  await user.save();
  await clearLoginFailures(request, credentials.username);
  const token = await signSession({
    userId: String(user._id),
    role: user.role,
    sessionVersion: user.sessionVersion,
  });
  const response = NextResponse.json({
    user: { id: String(user._id), username: user.username, role: user.role },
  });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  await recordAudit({
    actorUserId: user._id,
    action: "LOGIN_SUCCEEDED",
    entityType: "User",
    entityId: user._id,
    requestId,
  });
  return response;
});
