"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { enqueueOperation, getOperation } from "@/offline/outbox";
import { syncOutbox } from "@/offline/sync-manager";
import {
  cacheOrders,
  getCachedOrder,
  patchCachedOrder,
} from "@/offline/indexed-db";
import { SystemEditor } from "@/components/orders/system-editor";
import { AddSystemForm } from "@/components/orders/add-system-form";
async function fetchOrder(id) {
  try {
    const response = await fetch(`/api/orders/${id}`);
    if (!response.ok) throw new Error();
    const item = (await response.json()).item;
    await cacheOrders([item]);
    return item;
  } catch {
    const cached = await getCachedOrder(id);
    if (cached) return cached;
    throw new Error("No fue posible abrir la orden.");
  }
}
export function TechnicianOrderDetail({ id }) {
  const client = useQueryClient();
  const {
    data: order,
    isLoading,
    error,
  } = useQuery({ queryKey: ["orders", id], queryFn: () => fetchOrder(id) });
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState(null);
  const [observation, setObservation] = useState("");
  const [reasonId, setReasonId] = useState("");
  const [isMutating, setIsMutating] = useState(false);
  const { data: reasons = [] } = useQuery({
    queryKey: ["not-completed-reasons"],
    queryFn: async () => {
      const response = await fetch("/api/not-completed-reasons");
      return response.ok ? (await response.json()).items : [];
    },
  });
  const mutate = async (kind, payload = {}) => {
    if (isMutating) return;
    setIsMutating(true);
    try {
      const operation = await enqueueOperation(kind, id, payload);
      const local = await patchCachedOrder(id, (current) => ({
        ...current,
        status: kind === "START_ORDER" ? "IN_PROGRESS" : payload.result,
        completionResult: payload.result || current.completionResult,
        technicianObservation:
          payload.observation || current.technicianObservation,
      }));
      if (local) client.setQueryData(["orders", id], local);
      setMessage("Guardado en el dispositivo. Pendiente de sincronización.");
      if (navigator.onLine) {
        await syncOutbox();
        const stored = await getOperation(operation.operationId);
        if (stored?.status === "SYNCED") {
          setMessage("Sincronizado");
          await client.invalidateQueries({ queryKey: ["orders", id] });
        } else if (stored?.status === "CONFLICT")
          setMessage(
            "Conflicto de sincronización. Revisa la sección Sincronización.",
          );
      }
    } catch {
      setMessage("No fue posible guardar la operación en el dispositivo.");
    } finally {
      setIsMutating(false);
    }
  };
  if (isLoading)
    return <div className="h-64 animate-pulse rounded-xl bg-zinc-200" />;
  if (error) return <p role="alert">{error.message}</p>;
  const customer = order.customerId;
  const name =
    customer.companyName ||
    `${customer.firstName || ""} ${customer.lastName || ""}`;
  const address = order.installationId.address;
  return (
    <div className="space-y-4">
      <section className="rounded-xl bg-white p-4">
        <div className="flex justify-between">
          <h1 className="text-xl font-bold">OS {order.externalOrderNumber}</h1>
          <span className="text-sm font-semibold">{order.status}</span>
        </div>
        <h2 className="mt-4 text-lg font-semibold">{name}</h2>
        <p>{customer.subscriber ? "ABONADO" : "NO ABONADO"}</p>
        <a
          className="mt-2 block text-red-800 underline"
          href={`tel:${customer.primaryPhone}`}
        >
          {customer.primaryPhone}
        </a>
        <p className="mt-3">{address}</p>
        {customer.secondaryPhone && (
          <a
            className="mt-1 block text-red-800 underline"
            href={`tel:${customer.secondaryPhone}`}
          >
            {customer.secondaryPhone}
          </a>
        )}
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-zinc-500">Compañero</dt>
            <dd>
              {order.companionEmployeeId
                ? `${order.companionEmployeeId.firstName} ${order.companionEmployeeId.lastName}`
                : "Solo"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Vehículo</dt>
            <dd>{order.vehicleId?.plate || "Sin vehículo"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Fecha</dt>
            <dd>{new Date(order.scheduledDate).toLocaleDateString("es-UY")}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Hora</dt>
            <dd>{order.scheduledTime}</dd>
          </div>
        </dl>
        <a
          className="mt-3 inline-flex min-h-12 items-center rounded-lg bg-zinc-900 px-4 font-semibold text-white"
          target="_blank"
          rel="noreferrer"
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
        >
          Abrir en Maps
        </a>
      </section>
      <section className="space-y-2">
        <h2 className="font-bold">Sistemas instalados</h2>
        {order.systems?.map((system) => (
          <SystemEditor
            key={system._id}
            system={system}
            serviceOrderId={id}
            onSaved={() =>
              client.invalidateQueries({ queryKey: ["orders", id] })
            }
          />
        ))}
        <AddSystemForm
          order={order}
          onSaved={() => client.invalidateQueries({ queryKey: ["orders", id] })}
        />
      </section>
      {!!order.technicalHistory?.length && (
        <section className="rounded-xl bg-white p-4">
          <h2 className="font-bold">Historial técnico</h2>
          <ol className="mt-2 divide-y">
            {order.technicalHistory.map((visit) => (
              <li key={visit._id} className="py-2 text-sm">
                <strong>{visit.status}</strong> ·{" "}
                {new Date(visit.scheduledDate).toLocaleDateString("es-UY")}
                <p className="text-zinc-600">
                  {visit.technicianObservation || visit.quoteDetails}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}
      <section className="rounded-xl bg-white p-4">
        <h2 className="font-bold">Trabajo a realizar</h2>
        <p className="mt-2 whitespace-pre-wrap">{order.workDescription}</p>
        {order.technicianNote && (
          <p className="mt-3 rounded-lg bg-amber-50 p-3">
            {order.technicianNote}
          </p>
        )}
      </section>
      {order.status === "ASSIGNED" && (
        <button
          disabled={isMutating}
          className="min-h-14 w-full rounded-xl bg-red-800 text-lg font-bold text-white disabled:opacity-60"
          onClick={() => mutate("START_ORDER")}
        >
          INICIAR
        </button>
      )}
      {order.status === "IN_PROGRESS" && (
        <section className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              ["COMPLETED", "Realizada"],
              ["REQUIRES_QUOTE", "Cotizar"],
              ["NOT_COMPLETED", "No realizada"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className="min-h-14 rounded-lg border bg-white text-sm font-bold"
              >
                {label}
              </button>
            ))}
          </div>
          {mode === "NOT_COMPLETED" && (
            <select
              aria-label="Motivo"
              required
              className="min-h-12 w-full rounded-lg border px-3"
              value={reasonId}
              onChange={(event) => setReasonId(event.target.value)}
            >
              <option value="">Seleccionar motivo</option>
              {reasons.map((reason) => (
                <option key={reason._id} value={reason._id}>
                  {reason.label}
                </option>
              ))}
            </select>
          )}
          {mode && (
            <>
              <label className="block font-medium" htmlFor="observation">
                Observación
              </label>
              <textarea
                id="observation"
                className="min-h-28 w-full rounded-lg border p-3"
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
              />
              <button
                disabled={isMutating || (mode === "NOT_COMPLETED" && !reasonId)}
                className="min-h-12 w-full rounded-lg bg-emerald-700 font-bold text-white"
                onClick={() =>
                  mutate("COMPLETE_ORDER", {
                    result: mode,
                    observation,
                    ...(mode === "REQUIRES_QUOTE"
                      ? { quoteDetails: observation }
                      : {}),
                    ...(mode === "NOT_COMPLETED"
                      ? { notCompletedReasonId: reasonId }
                      : {}),
                  })
                }
              >
                Confirmar resultado
              </button>
            </>
          )}
        </section>
      )}
      {message && (
        <p role="status" className="rounded-lg bg-blue-50 p-3 text-sm">
          {message}
        </p>
      )}
    </div>
  );
}
