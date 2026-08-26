import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/http/api-handler";
import { connectDatabase } from "@/lib/db/mongoose";
import { requireUser } from "@/lib/permissions/authorize";
import { AuditEvent } from "@/modules/audit/audit.model";
import { SystemEvent } from "@/modules/operations/system-event.model";

export const GET = withApiHandler(async () => {
  const actor = await requireUser(["OWNER"]);
  const startedAt = performance.now();
  const connection = await connectDatabase();
  await connection.connection.db.command({ ping: 1 });
  const databaseLatencyMs = Math.round(performance.now() - startedAt);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [
    failuresLast24Hours,
    warningsLast24Hours,
    auditEventsLast24Hours,
    recentFailures,
  ] = await Promise.all([
    SystemEvent.countDocuments({ level: "ERROR", createdAt: { $gte: since } }),
    SystemEvent.countDocuments({
      level: "WARNING",
      createdAt: { $gte: since },
    }),
    AuditEvent.countDocuments({ createdAt: { $gte: since } }),
    SystemEvent.find({}).sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  return NextResponse.json({
    status: "ok",
    checkedAt: new Date().toISOString(),
    version: process.env.npm_package_version || "0.1.0",
    environment: process.env.NODE_ENV,
    uptimeSeconds: Math.round(process.uptime()),
    database: {
      status: connection.connection.readyState === 1 ? "connected" : "unknown",
      name: connection.connection.name,
      latencyMs: databaseLatencyMs,
    },
    counters: {
      failuresLast24Hours,
      warningsLast24Hours,
      auditEventsLast24Hours,
    },
    recentFailures,
    viewer: actor,
  });
});
