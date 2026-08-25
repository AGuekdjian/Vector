export class AppError extends Error {
  constructor(code, message, status = 500, details) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function normalizeError(error) {
  if (error instanceof AppError) return error;
  if (error?.name === "ZodError")
    return new AppError(
      "VALIDATION_ERROR",
      "Los datos enviados no son válidos.",
      400,
    );
  if (error?.name === "ValidationError" || error?.name === "CastError")
    return new AppError(
      "VALIDATION_ERROR",
      "Los datos enviados no son válidos.",
      400,
    );
  return new AppError("INTERNAL_ERROR", "Ocurrió un error inesperado.", 500);
}
