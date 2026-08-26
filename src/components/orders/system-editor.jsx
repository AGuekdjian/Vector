"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { enqueueOperation, getOperation } from "@/offline/outbox";
import { syncOutbox } from "@/offline/sync-manager";
import { patchCachedOrder } from "@/offline/indexed-db";
const editorSchema = z.object({
  type: z.enum(["ALARM", "CCTV", "ACCESS_CONTROL", "OTHER"]),
  brand: z.string().trim().max(100),
  model: z.string().trim().max(100),
  description: z.string().trim().max(2000),
  imei: z.string().trim(),
  serialNumber: z.string().trim().max(200),
  technicalNotes: z.string().trim().max(4000),
  installedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .or(z.literal("")),
});
export function SystemEditor({ system, serviceOrderId, onSaved }) {
  const { register, handleSubmit, getValues } = useForm({
    resolver: zodResolver(editorSchema),
    defaultValues: {
      type: system.type,
      brand: system.brand || "",
      model: system.model || "",
      description: system.description || "",
      imei: system.imei || "",
      serialNumber: system.serialNumber || "",
      technicalNotes: system.technicalNotes || "",
      installedAt: system.installedAt?.slice(0, 10) || "",
    },
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const queue = async (kind, payload, optimistic) => {
    if (saving) return;
    setSaving(true);
    try {
      const cleaned = Object.fromEntries(
        Object.entries(payload).filter(
          ([field, value]) => field !== "installedAt" || value,
        ),
      );
      const operation = await enqueueOperation(kind, system._id, {
        ...cleaned,
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
  const save = async (form) => {
    await queue("UPDATE_SYSTEM", form, (order) => ({
      ...order,
      systems: order.systems.map((item) =>
        item._id === system._id ? { ...item, ...form } : item,
      ),
    }));
  };
  const lifecycle = async (kind) => {
    const form = getValues();
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
      <form
        className="mt-3 grid gap-2"
        onSubmit={handleSubmit(save)}
        noValidate
      >
        {Object.keys(getValues())
          .filter((field) => field !== "type")
          .map((field) =>
            ["technicalNotes", "description"].includes(field) ? (
              <textarea
                key={field}
                aria-label="Observaciones técnicas"
                className="min-h-20 rounded border p-2"
                {...register(field)}
              />
            ) : (
              <input
                key={field}
                aria-label={field}
                placeholder={field}
                type={field === "installedAt" ? "date" : "text"}
                className="min-h-10 rounded border px-2"
                {...register(field)}
              />
            ),
          )}
        <button
          disabled={saving}
          type="submit"
          className="min-h-10 rounded bg-zinc-900 text-white"
        >
          Guardar datos técnicos
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={saving}
            type="button"
            onClick={() => lifecycle("RETIRE_SYSTEM")}
            className="min-h-10 rounded border border-red-700 text-red-800"
          >
            Retirar
          </button>
          <button
            disabled={saving}
            type="button"
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
      </form>
    </details>
  );
}
