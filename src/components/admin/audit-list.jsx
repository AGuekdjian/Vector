"use client";
import { useQuery } from "@tanstack/react-query";
export function AuditList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["audit"],
    queryFn: async () => {
      const r = await fetch("/api/audit?limit=100");
      const b = await r.json();
      if (!r.ok) throw new Error(b.error?.message);
      return b;
    },
  });
  if (isLoading) return <p>Cargando…</p>;
  if (error) return <p role="alert">{error.message}</p>;
  return (
    <ol className="divide-y rounded-xl border bg-white">
      {data.items.map((x) => (
        <li key={x._id} className="p-4">
          <div className="flex flex-wrap justify-between gap-2">
            <strong>{x.action}</strong>
            <time className="text-sm text-zinc-600">
              {new Date(x.createdAt).toLocaleString("es-UY")}
            </time>
          </div>
          <p className="mt-1 text-sm">
            {x.entityType} · {x.actorUserId?.username || "Sistema"} ·{" "}
            {x.requestId}
          </p>
        </li>
      ))}
    </ol>
  );
}
