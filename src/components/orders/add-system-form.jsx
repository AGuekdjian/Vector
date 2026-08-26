"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { enqueueOperation, getOperation } from "@/offline/outbox";
import { syncOutbox } from "@/offline/sync-manager";
import { patchCachedOrder } from "@/offline/indexed-db";
const systemFormSchema = z.object({
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
export function AddSystemForm({ order, onSaved }) {
  const { register, handleSubmit, reset } = useForm({
    resolver: zodResolver(systemFormSchema),
    defaultValues: {
      type: "ALARM",
      brand: "",
      model: "",
      description: "",
      imei: "",
      serialNumber: "",
      technicalNotes: "",
      installedAt: "",
    },
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const save = async (form) => {
    if (saving) return;
    setSaving(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(
          ([field, value]) => field !== "installedAt" || value,
        ),
      );
      const operation = await enqueueOperation(
        "ADD_SYSTEM",
        order._id,
        payload,
      );
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
      reset();
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
      <form
        className="mt-3 grid gap-2"
        onSubmit={handleSubmit(save)}
        noValidate
      >
        <select
          aria-label="Tipo nuevo sistema"
          className="min-h-10 rounded border px-2"
          {...register("type")}
        >
          {["ALARM", "CCTV", "ACCESS_CONTROL", "OTHER"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        {[
          "brand",
          "model",
          "description",
          "imei",
          "serialNumber",
          "technicalNotes",
          "installedAt",
        ].map((field) =>
          ["description", "technicalNotes"].includes(field) ? (
            <textarea
              key={field}
              aria-label={`Nuevo ${field}`}
              placeholder={field}
              className="min-h-20 rounded border p-2"
              {...register(field)}
            />
          ) : (
            <input
              key={field}
              type={field === "installedAt" ? "date" : "text"}
              aria-label={`Nuevo ${field}`}
              placeholder={field}
              className="min-h-10 rounded border px-2"
              {...register(field)}
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
