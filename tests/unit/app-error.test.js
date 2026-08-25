import { describe, expect, it } from "vitest";
import { AppError, normalizeError } from "@/lib/errors/app-error";
import { z } from "zod";

describe("normalizeError", () => {
  it("preserves controlled errors", () => {
    const error = new AppError("FORBIDDEN", "Sin permiso", 403);
    expect(normalizeError(error)).toBe(error);
  });
  it("does not expose unexpected messages", () => {
    expect(normalizeError(new Error("secret detail"))).toMatchObject({
      code: "INTERNAL_ERROR",
      status: 500,
      message: "Ocurrió un error inesperado.",
    });
  });
  it("turns schema failures into safe validation errors", () => {
    let caught;
    try {
      z.string().parse(123);
    } catch (error) {
      caught = error;
    }
    expect(normalizeError(caught)).toMatchObject({
      code: "VALIDATION_ERROR",
      status: 400,
    });
  });
});
