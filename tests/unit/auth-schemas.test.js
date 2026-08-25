import { describe, expect, it } from "vitest";
import { createUserSchema, loginSchema } from "@/modules/auth/auth.schemas";
const employeeId = "507f1f77bcf86cd799439011";
describe("authentication validation", () => {
  it("normalizes login usernames", () =>
    expect(
      loginSchema.parse({ username: "  ÁAdmin  ", password: "1234" }).username,
    ).toBe("áadmin"));
  it("allows an operational technician PIN", () =>
    expect(
      createUserSchema.safeParse({
        employeeId,
        role: "TECHNICIAN",
        password: "7391",
      }).success,
    ).toBe(true));
  it("requires strong administrative passwords", () => {
    expect(
      createUserSchema.safeParse({
        employeeId,
        role: "ADMIN",
        password: "weakpassword",
      }).success,
    ).toBe(false);
    expect(
      createUserSchema.safeParse({
        employeeId,
        role: "ADMIN",
        password: "Strong!Password9",
      }).success,
    ).toBe(true);
  });
});
