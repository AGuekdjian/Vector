import { expect, it } from "vitest";
import { assertOwnerProtected } from "@/lib/permissions/authorize";
it("prevents admins from modifying the owner", () =>
  expect(() =>
    assertOwnerProtected({ role: "ADMIN" }, { role: "OWNER" }),
  ).toThrow("propietario"));
it("allows the owner to modify owner records", () =>
  expect(() =>
    assertOwnerProtected({ role: "OWNER" }, { role: "OWNER" }),
  ).not.toThrow());
