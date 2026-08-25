// @vitest-environment node
import { beforeAll, expect, it } from "vitest";
beforeAll(() => {
  process.env.MONGODB_URI = "mongodb://localhost:27017/vector-test";
  process.env.AUTH_SECRET =
    "test-secret-that-is-longer-than-thirty-two-characters";
  process.env.NEXT_PUBLIC_APP_NAME = "Vector";
  process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
});
it("signs verifiable sessions and rejects tampering", async () => {
  const { signSession, verifySessionToken } =
    await import("@/modules/auth/session");
  const token = await signSession({
    userId: "507f1f77bcf86cd799439011",
    role: "OWNER",
    sessionVersion: 0,
  });
  expect(await verifySessionToken(token)).toMatchObject({
    role: "OWNER",
    sessionVersion: 0,
  });
  expect(await verifySessionToken(`${token}tampered`)).toBeNull();
});
