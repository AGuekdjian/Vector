"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
export function AuditList() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useQuery({
    queryKey: ["audit", page],
    queryFn: async () => {
      const r = await fetch(`/api/audit?page=${page}&limit=50`);
      const b = await r.json();
      if (!r.ok) throw new Error(b.error?.message);
      return b;
    },
  });
  if (isLoading) return <p>Cargando…</p>;
  if (error) return <p role="alert">{error.message}</p>;
  return (
    <>
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
      <div className="mt-3 flex items-center justify-between">
        <button
          disabled={page === 1}
          className="rounded border px-3 py-2 disabled:opacity-40"
          onClick={() => setPage((value) => Math.max(1, value - 1))}
        >
          Anterior
        </button>
        <span className="text-sm">
          Página {page} de {Math.max(1, Math.ceil(data.total / 50))}
        </span>
        <button
          disabled={page * 50 >= data.total}
          className="rounded border px-3 py-2 disabled:opacity-40"
          onClick={() => setPage((value) => value + 1)}
        >
          Siguiente
        </button>
      </div>
    </>
  );
}
