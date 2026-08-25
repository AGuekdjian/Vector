import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/http/api-handler";
import { SESSION_COOKIE, sessionCookieOptions } from "@/modules/auth/session";

export const POST = withApiHandler(async () => {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
  return response;
});
