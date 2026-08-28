"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { CardSkeleton, ListSkeleton } from "@/components/ui/skeleton";

const get = async (url) => {
  const response = await fetch(url);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message);
  return body;
};

const duration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours} h ${minutes} min`;
};

export function SystemPanel() {
  const [view, setView] = useState("failures");
  const status = useQuery({
    queryKey: ["owner-system-status"],
    queryFn: () => get("/api/owner/system-status"),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
  const audit = useQuery({
    queryKey: ["owner-audit-preview"],
    queryFn: () => get("/api/audit?page=1&limit=10"),
    staleTime: 15_000,
  });

  if (status.isError)
    return (
      <div role="alert" className="alert-error">
        No fue posible consultar el estado: {status.error.message}
      </div>
    );

  return (
    <div className="space-y-6">
      <section aria-labelledby="system-summary">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Supervisión</p>
            <h2 id="system-summary">Estado del sistema</h2>
          </div>
          {status.data && (
            <span className="status-chip status-success">
              Operativo · actualizado{" "}
              {new Date(status.data.checkedAt).toLocaleTimeString("es-UY")}
            </span>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {status.isLoading ? (
            <CardSkeleton count={4} />
          ) : (
            <>
              <article className="metric-card">
                <span>Aplicación</span>
                <strong>v{status.data.version}</strong>
                <small>{status.data.environment}</small>
              </article>
              <article className="metric-card">
                <span>MongoDB</span>
                <strong className="text-emerald-700">Conectado</strong>
                <small>
                  {status.data.database.latencyMs} ms ·{" "}
                  {status.data.database.name}
                </small>
              </article>
              <article className="metric-card">
                <span>Actividad (24 h)</span>
                <strong>{status.data.counters.auditEventsLast24Hours}</strong>
                <small>eventos auditados</small>
              </article>
              <article className="metric-card">
                <span>Fallas (24 h)</span>
                <strong
                  className={
                    status.data.counters.failuresLast24Hours
                      ? "text-red-800"
                      : "text-emerald-700"
                  }
                >
                  {status.data.counters.failuresLast24Hours}
                </strong>
                <small>
                  {status.data.counters.warningsLast24Hours} solicitudes
                  rechazadas · uptime {duration(status.data.uptimeSeconds)}
                </small>
              </article>
            </>
          )}
        </div>
      </section>

      <div
        className="view-tabs"
        role="tablist"
        aria-label="Detalle del sistema"
      >
        <button
          type="button"
          role="tab"
          aria-selected={view === "failures"}
          onClick={() => setView("failures")}
        >
          Fallas recientes
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "activity"}
          onClick={() => setView("activity")}
        >
          Actividad reciente
        </button>
      </div>
      <div>
        <section hidden={view !== "failures"}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Diagnóstico</p>
              <h2>Fallas recientes</h2>
            </div>
          </div>
          {status.isLoading ? (
            <ListSkeleton />
          ) : status.data.recentFailures.length ? (
            <ol className="surface-card divide-y divide-zinc-100">
              {status.data.recentFailures.map((event) => (
                <li key={event._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <strong className="text-sm text-red-900">
                      {event.code}
                    </strong>
                    <time className="shrink-0 text-xs text-zinc-500">
                      {new Date(event.createdAt).toLocaleString("es-UY")}
                    </time>
                  </div>
                  <p className="mt-1 text-sm text-zinc-700">{event.message}</p>
                  <p className="mt-2 font-mono text-xs text-zinc-500">
                    {event.method} {event.path} · HTTP {event.status} ·{" "}
                    {event.requestId}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <div className="empty-state">No se registraron fallas.</div>
          )}
        </section>

        <section hidden={view !== "activity"}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Trazabilidad</p>
              <h2>Actividad reciente</h2>
            </div>
            <Link href="/audit" className="text-link">
              Actividad completa
            </Link>
          </div>
          {audit.isLoading ? (
            <ListSkeleton />
          ) : (
            <ol className="surface-card divide-y divide-zinc-100">
              {audit.data?.items.map((event) => (
                <li key={event._id} className="p-4">
                  <div className="flex justify-between gap-3">
                    <strong className="text-sm">{event.action}</strong>
                    <time className="shrink-0 text-xs text-zinc-500">
                      {new Date(event.createdAt).toLocaleString("es-UY")}
                    </time>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">
                    {event.entityType} ·{" "}
                    {event.actorUserId?.username || "Sistema"}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
