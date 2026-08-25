import { expect, it } from "vitest";
import { sanitizeLogContext } from "@/lib/logger/logger";

it("redacts sensitive log fields", () => {
  expect(
    sanitizeLogContext({
      userId: "1",
      passwordHash: "hash",
      nested: { token: "token", value: "safe" },
    }),
  ).toEqual({
    userId: "1",
    passwordHash: "[REDACTED]",
    nested: { token: "[REDACTED]", value: "safe" },
  });
});
