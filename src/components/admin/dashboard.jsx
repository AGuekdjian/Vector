"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CardSkeleton } from "@/components/ui/skeleton";

export function Dashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["statistics"],
    queryFn: async () => {
      const response = await fetch("/api/statistics");
      if (!response.ok) throw new Error();
      return response.json();
    },
  });
  if (isLoading)
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <CardSkeleton count={6} />
      </div>
    );
  if (isError)
    return (
      <div className="alert-error">
        No fue posible cargar el resumen operativo.
      </div>
    );

  const completed = data.byStatus.COMPLETED || 0;
  const quoted = data.byStatus.REQUIRES_QUOTE || 0;
  const notCompleted = data.byStatus.NOT_COMPLETED || 0;
  const completionRate = data.thisMonth
    ? Math.round((completed / data.thisMonth) * 100)
    : 0;
  const cards = [
    {
      label: "Este mes",
      value: data.thisMonth,
      note: "órdenes registradas",
      tone: "neutral",
    },
    {
      label: "Mes anterior",
      value: data.previousMonth,
      note: "para comparar actividad",
      tone: "neutral",
    },
    {
      label: "Realizadas",
      value: completed,
      note: "trabajos completados",
      tone: "success",
    },
    {
      label: "Requieren cotización",
      value: quoted,
      note: "pendientes de definición",
      tone: "warning",
    },
    {
      label: "No realizadas",
      value: notCompleted,
      note: "requieren seguimiento",
      tone: "danger",
    },
  ];
  return (
    <div className="space-y-5">
      <section className="dashboard-spotlight">
        <div>
          <p className="dashboard-kicker">Actividad de hoy</p>
          <p className="dashboard-big-number">{data.today}</p>
          <p className="text-sm text-white/65">órdenes programadas para hoy</p>
        </div>
        <div className="dashboard-progress-panel">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-white/65">Realizadas este mes</p>
              <p className="mt-1 text-3xl font-bold">{completionRate}%</p>
            </div>
            <Link href="/orders" className="dashboard-action">
              Ver órdenes <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div
            className="dashboard-progress"
            role="progressbar"
            aria-label={`${completionRate}% de las órdenes del mes están realizadas`}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={completionRate}
          >
            <span style={{ width: `${completionRate}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/55">
            {completed} realizadas de {data.thisMonth} órdenes del mes
          </p>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.label}
            className={`metric-card metric-${card.tone}`}
          >
            <span className="metric-indicator" aria-hidden="true" />
            <p className="text-sm font-medium text-zinc-600">{card.label}</p>
            <strong>{card.value}</strong>
            <small>{card.note}</small>
          </article>
        ))}
      </div>
    </div>
  );
}
