"use client";
import { useQuery } from "@tanstack/react-query";
export function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["statistics"],
    queryFn: async () => {
      const r = await fetch("/api/statistics");
      if (!r.ok) throw new Error();
      return r.json();
    },
  });
  const cards = data
    ? [
        { label: "Órdenes hoy", value: data.today },
        { label: "Este mes", value: data.thisMonth },
        { label: "Mes anterior", value: data.previousMonth },
        { label: "Realizadas", value: data.byStatus.COMPLETED || 0 },
        { label: "Cotización", value: data.byStatus.REQUIRES_QUOTE || 0 },
        { label: "No realizadas", value: data.byStatus.NOT_COMPLETED || 0 },
      ]
    : [];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {isLoading
        ? [1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-28 animate-pulse rounded-xl bg-zinc-200"
            />
          ))
        : cards.map((c) => (
            <article key={c.label} className="rounded-xl border bg-white p-5">
              <p className="text-sm text-zinc-600">{c.label}</p>
              <p className="mt-2 text-3xl font-bold">{c.value}</p>
            </article>
          ))}
    </div>
  );
}
