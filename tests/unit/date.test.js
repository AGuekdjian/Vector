import { describe, expect, it } from "vitest";
import { getUruguayCalendarBoundaries } from "@/shared/date";

describe("Uruguay calendar boundaries", () => {
  it("includes dates stored at UTC midnight in the selected local day", () => {
    const range = getUruguayCalendarBoundaries(
      new Date("2026-08-28T12:00:00.000Z"),
    );
    const scheduled = new Date("2026-08-28T00:00:00.000Z");
    expect(scheduled >= range.today).toBe(true);
    expect(scheduled < range.tomorrow).toBe(true);
    expect(range.month.toISOString()).toBe("2026-08-01T00:00:00.000Z");
  });
});
