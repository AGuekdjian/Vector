import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env/server";

export const SESSION_COOKIE = "vector_session";
const durationSeconds = 60 * 60 * 12;
const key = () => new TextEncoder().encode(getServerEnv().AUTH_SECRET);

export async function signSession(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${durationSeconds}s`)
    .sign(key());
}
export async function verifySessionToken(token) {
  if (!token) return null;
  try {
    return (await jwtVerify(token, key(), { algorithms: ["HS256"] })).payload;
  } catch {
    return null;
  }
}
export async function readSession() {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: durationSeconds,
    priority: "high",
  };
}
