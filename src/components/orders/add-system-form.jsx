"use client";
import { useState } from "react";
import { enqueueOperation, getOperation } from "@/offline/outbox";
import { syncOutbox } from "@/offline/sync-manager";
import { patchCachedOrder } from "@/offline/indexed-db";
export function AddSystemForm({ order, onSaved }) {
  const [form, setForm] = useState({
    type: "ALARM",
    brand: "",
    model: "",
    imei: "",
    serialNumber: "",
    technicalNotes: "",
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const save = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const operation = await enqueueOperation("ADD_SYSTEM", order._id, form);
      await patchCachedOrder(order._id, (current) => ({
        ...current,
        systems: [
          ...(current.systems || []),
          {
            ...form,
            _id: `local_${operation.operationId}`,
            status: "ACTIVE",
            active: true,
          },
        ],
      }));
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
      setMessage("No fue posible guardar el sistema.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <details className="rounded-lg border border-dashed bg-white p-3">
      <summary className="cursor-pointer font-semibold">
        Agregar sistema instalado
      </summary>
      <form className="mt-3 grid gap-2" onSubmit={save}>
        <select
          aria-label="Tipo nuevo sistema"
          className="min-h-10 rounded border px-2"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          {["ALARM", "CCTV", "ACCESS_CONTROL", "OTHER"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        {["brand", "model", "imei", "serialNumber", "technicalNotes"].map(
          (field) => (
            <input
              key={field}
              aria-label={`Nuevo ${field}`}
              placeholder={field}
              className="min-h-10 rounded border px-2"
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            />
          ),
        )}
        <button
          disabled={saving}
          className="min-h-10 rounded bg-red-800 text-white disabled:opacity-60"
        >
          Agregar sistema
        </button>
        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
      </form>
    </details>
  );
}
