"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ListSkeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import Link from "next/link";
export function AuditList() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const { data, isLoading, error } = useQuery({
    queryKey: ["audit", page, entityType, debouncedSearch],
    queryFn: async () => {
      const r = await fetch(
        `/api/audit?page=${page}&limit=50&entityType=${entityType}&q=${encodeURIComponent(debouncedSearch)}`,
      );
      const b = await r.json();
      if (!r.ok) throw new Error(b.error?.message);
      return b;
    },
  });
  if (isLoading) return <ListSkeleton count={8} />;
  if (error)
    return (
      <p role="alert" className="alert-error">
        {error.message}
      </p>
    );
  return (
    <>
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_220px]">
        <input
          aria-label="Buscar en auditoría"
          placeholder="Buscar acción o request ID"
          className="min-h-11 rounded-lg border px-3"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <select
          aria-label="Tipo de registro"
          className="min-h-11 rounded-lg border px-3"
          value={entityType}
          onChange={(event) => {
            setEntityType(event.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos los registros</option>
          <option value="ServiceOrder">Órdenes</option>
          <option value="Customer">Clientes</option>
          <option value="Installation">Ubicaciones</option>
          <option value="InstalledSystem">Sistemas</option>
          <option value="User">Usuarios</option>
          <option value="Employee">Empleados</option>
          <option value="Vehicle">Vehículos</option>
        </select>
      </div>
      <ol className="surface-card divide-y divide-zinc-100">
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
            {x.entityType === "ServiceOrder" && x.entityId && (
              <Link
                className="text-link mt-2 inline-block"
                href={`/orders/${x.entityId}`}
              >
                Abrir orden
              </Link>
            )}
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
