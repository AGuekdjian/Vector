import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { normalizeError } from "@/lib/errors/app-error";
import { log } from "@/lib/logger/logger";
import { AppError } from "@/lib/errors/app-error";
import { connectDatabase } from "@/lib/db/mongoose";
import { SystemEvent } from "@/modules/operations/system-event.model";

const firstForwardedValue = (value) => value?.split(",", 1)[0].trim();

export function isAllowedRequestOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const requestUrl = new URL(request.url);
  const publicHost =
    firstForwardedValue(request.headers.get("x-forwarded-host")) ||
    request.headers.get("host") ||
    requestUrl.host;
  const forwardedProtocol = firstForwardedValue(
    request.headers.get("x-forwarded-proto"),
  );
  const originUrl = new URL(origin);
  return (
    originUrl.host === publicHost &&
    (!forwardedProtocol || originUrl.protocol === `${forwardedProtocol}:`)
  );
}

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
        if (!isAllowedRequestOrigin(request))
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
      const durationMs = Math.round(performance.now() - startedAt);
      const path = new URL(request.url).pathname;
      log("error", error.message, {
        requestId,
        code: error.code,
        error: caught instanceof Error ? caught.name : "UnknownError",
        method: request.method,
        path,
        durationMs,
      });
      try {
        await connectDatabase();
        await SystemEvent.create({
          level: error.status >= 500 ? "ERROR" : "WARNING",
          message: error.message,
          code: error.code,
          requestId,
          method: request.method,
          path,
          status: error.status,
          durationMs,
        });
      } catch {
        // Console logging remains available if persistence itself is unavailable.
      }
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
