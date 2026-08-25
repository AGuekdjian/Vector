"use client";
import { useState } from "react";
import { enqueueOperation, getOperation } from "@/offline/outbox";
import { syncOutbox } from "@/offline/sync-manager";
import { patchCachedOrder } from "@/offline/indexed-db";
export function SystemEditor({ system, serviceOrderId, onSaved }) {
  const [form, setForm] = useState({
    type: system.type,
    brand: system.brand || "",
    model: system.model || "",
    imei: system.imei || "",
    serialNumber: system.serialNumber || "",
    technicalNotes: system.technicalNotes || "",
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const queue = async (kind, payload, optimistic) => {
    if (saving) return;
    setSaving(true);
    try {
      const operation = await enqueueOperation(kind, system._id, {
        ...payload,
        serviceOrderId,
      });
      await patchCachedOrder(serviceOrderId, optimistic);
      onSaved?.();
      setMessage("Guardado en el dispositivo. Pendiente de sincronización.");
      if (navigator.onLine) {
        await syncOutbox();
        const stored = await getOperation(operation.operationId);
        if (stored?.status === "SYNCED") {
          setMessage("Sincronizado");
          onSaved?.();
        } else if (stored?.status === "CONFLICT") {
          setMessage("Conflicto de sincronización. Revisa Sincronización.");
        }
      }
    } catch {
      setMessage("No fue posible guardar el cambio.");
    } finally {
      setSaving(false);
    }
  };
  const save = async () => {
    await queue("UPDATE_SYSTEM", form, (order) => ({
      ...order,
      systems: order.systems.map((item) =>
        item._id === system._id ? { ...item, ...form } : item,
      ),
    }));
  };
  const lifecycle = async (kind) => {
    await queue(kind, kind === "REPLACE_SYSTEM" ? form : {}, (order) => ({
      ...order,
      systems: order.systems.map((item) =>
        item._id === system._id
          ? {
              ...item,
              status: kind === "RETIRE_SYSTEM" ? "RETIRED" : "REPLACED",
            }
          : item,
      ),
    }));
  };
  return (
    <details className="rounded-lg border bg-white p-3">
      <summary className="cursor-pointer font-semibold">
        {system.type}: {system.brand} {system.model}
      </summary>
      <div className="mt-3 grid gap-2">
        {Object.keys(form)
          .filter((field) => field !== "type")
          .map((field) =>
            field === "technicalNotes" ? (
              <textarea
                key={field}
                aria-label="Observaciones técnicas"
                className="min-h-20 rounded border p-2"
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              />
            ) : (
              <input
                key={field}
                aria-label={field}
                placeholder={field}
                className="min-h-10 rounded border px-2"
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              />
            ),
          )}
        <button
          disabled={saving}
          onClick={save}
          className="min-h-10 rounded bg-zinc-900 text-white"
        >
          Guardar datos técnicos
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={saving}
            onClick={() => lifecycle("RETIRE_SYSTEM")}
            className="min-h-10 rounded border border-red-700 text-red-800"
          >
            Retirar
          </button>
          <button
            disabled={saving}
            onClick={() => lifecycle("REPLACE_SYSTEM")}
            className="min-h-10 rounded bg-red-800 text-white"
          >
            Reemplazar
          </button>
        </div>
        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
      </div>
    </details>
  );
}
