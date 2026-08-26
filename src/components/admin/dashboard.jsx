"use client";
import { useQuery } from "@tanstack/react-query";
import { CardSkeleton } from "@/components/ui/skeleton";
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
      {isLoading ? (
        <CardSkeleton count={6} />
      ) : (
        cards.map((c) => (
          <article key={c.label} className="metric-card">
            <p className="text-sm text-zinc-600">{c.label}</p>
            <p className="mt-2 text-3xl font-bold">{c.value}</p>
          </article>
        ))
      )}
    </div>
  );
}
