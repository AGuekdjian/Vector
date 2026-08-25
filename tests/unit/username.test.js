import { describe, expect, it, vi } from "vitest";
import { generateUniqueUsername, usernameBase } from "@/modules/auth/username";
describe("usernames", () => {
  it("normalizes names and accents", () =>
    expect(usernameBase("Ánthony", "Guekdjián Pérez")).toBe("aguekdjianperez"));
  it("adds a suffix on collisions", async () => {
    const exists = vi.fn(async (value) =>
      ["aguekdjian", "aguekdjian2"].includes(value),
    );
    expect(await generateUniqueUsername("Anthony", "Guekdjian", exists)).toBe(
      "aguekdjian3",
    );
  });
});
