import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { normalizeError } from "@/lib/errors/app-error";
import { log } from "@/lib/logger/logger";
import { AppError } from "@/lib/errors/app-error";

export function withApiHandler(handler) {
  return async function apiHandler(request, context) {
    const startedAt = performance.now();
    const requestId =
      request.headers.get("x-request-id")?.slice(0, 100) ||
      `req_${randomUUID()}`;
    try {
      const contentLength = Number(request.headers.get("content-length") || 0);
      if (contentLength > 1_000_000)
        throw new AppError(
          "PAYLOAD_TOO_LARGE",
          "La solicitud supera el tamaño permitido.",
          413,
        );
      if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
        const origin = request.headers.get("origin");
        if (origin && new URL(origin).host !== new URL(request.url).host)
          throw new AppError(
            "FORBIDDEN",
            "Origen de solicitud no permitido.",
            403,
          );
      }
      const response = await handler(request, context, { requestId });
      response.headers.set("x-request-id", requestId);
      log("info", "request_completed", {
        requestId,
        method: request.method,
        path: new URL(request.url).pathname,
        status: response.status,
        durationMs: Math.round(performance.now() - startedAt),
      });
      return response;
    } catch (caught) {
      const error = normalizeError(caught);
      log("error", error.message, {
        requestId,
        code: error.code,
        error: caught instanceof Error ? caught.name : "UnknownError",
        method: request.method,
        path: new URL(request.url).pathname,
        durationMs: Math.round(performance.now() - startedAt),
      });
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
            requestId,
            ...(error.details && { details: error.details }),
          },
        },
        { status: error.status, headers: { "x-request-id": requestId } },
      );
    }
  };
}
