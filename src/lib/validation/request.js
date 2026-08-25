import mongoose from "mongoose";
import { AppError } from "@/lib/errors/app-error";

export async function parseJson(request, schema) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new AppError(
      "VALIDATION_ERROR",
      "El cuerpo de la solicitud no es JSON válido.",
      400,
    );
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    throw new AppError(
      "VALIDATION_ERROR",
      "Los datos enviados no son válidos.",
      400,
      parsed.error.flatten(),
    );
  return parsed.data;
}
export function objectId(value, label = "identificador") {
  if (!mongoose.isObjectIdOrHexString(value))
    throw new AppError("VALIDATION_ERROR", `${label} inválido.`, 400);
  return value;
}
export function pagination(searchParams) {
  const page = Math.max(
    1,
    Math.min(10_000, Number(searchParams.get("page")) || 1),
  );
  const limit = Math.max(
    1,
    Math.min(100, Number(searchParams.get("limit")) || 20),
  );
  return { page, limit, skip: (page - 1) * limit };
}
export function safeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 100);
}
