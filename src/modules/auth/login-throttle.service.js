import { createHash } from "node:crypto";
import { AppError } from "@/lib/errors/app-error";
import { LoginThrottle } from "./login-throttle.model";
const WINDOW = 15 * 60 * 1000;
const LIMIT = 10;
const keyFor = (request, username) =>
  createHash("sha256")
    .update(
      `${request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"}:${username}`,
    )
    .digest("hex");
export async function assertLoginAllowed(request, username) {
  const record = await LoginThrottle.findOne({
    key: keyFor(request, username),
  }).lean();
  if (record?.blockedUntil && record.blockedUntil > new Date())
    throw new AppError(
      "RATE_LIMITED",
      "Demasiados intentos. Intenta nuevamente más tarde.",
      429,
    );
}
export async function recordLoginFailure(request, username) {
  const key = keyFor(request, username);
  const now = new Date();
  const current = await LoginThrottle.findOne({ key });
  if (!current || now - current.windowStartedAt > WINDOW) {
    await LoginThrottle.findOneAndUpdate(
      { key },
      {
        $set: {
          attempts: 1,
          windowStartedAt: now,
          blockedUntil: null,
          expiresAt: new Date(Date.now() + WINDOW * 2),
        },
      },
      { upsert: true },
    );
    return;
  }
  current.attempts += 1;
  if (current.attempts >= LIMIT)
    current.blockedUntil = new Date(Date.now() + WINDOW);
  current.expiresAt = new Date(Date.now() + WINDOW * 2);
  await current.save();
}
export async function clearLoginFailures(request, username) {
  await LoginThrottle.deleteOne({ key: keyFor(request, username) });
}
