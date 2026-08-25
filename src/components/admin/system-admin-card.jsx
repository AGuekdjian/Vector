"use client";
import { useForm } from "react-hook-form";

export function SystemAdminCard({ system, onChanged }) {
  const editable = system.active && system.status === "ACTIVE";
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      brand: system.brand || "",
      model: system.model || "",
      description: system.description || "",
      technicalNotes: system.technicalNotes || "",
      imei: system.imei || "",
      serialNumber: system.serialNumber || "",
      installedAt: system.installedAt?.slice(0, 10) || "",
    },
  });
  const request = async (url, data) => {
    const payload = Object.fromEntries(
      Object.entries(data).filter(
        ([key, value]) => key !== "installedAt" || value,
      ),
    );
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error((await response.json()).error?.message);
    onChanged();
  };
  return (
    <details className="border-b p-3">
      <summary className="cursor-pointer font-semibold">
        {system.type}: {system.brand} {system.model} · {system.status}
        {!system.active && " · inactivo"}
      </summary>
      <form
        className="mt-3 grid gap-2 sm:grid-cols-2"
        onSubmit={handleSubmit((data) =>
          request(`/api/systems/${system._id}`, data),
        )}
      >
        {["brand", "model", "imei", "serialNumber"].map((field) => (
          <input
            key={field}
            disabled={!editable}
            aria-label={field}
            className="min-h-10 rounded border px-2"
            {...register(field)}
          />
        ))}
        <input
          disabled={!editable}
          type="date"
          aria-label="Fecha de instalación"
          className="min-h-10 rounded border px-2"
          {...register("installedAt")}
        />
        <textarea
          disabled={!editable}
          aria-label="Descripción"
          className="min-h-20 rounded border p-2"
          {...register("description")}
        />
        <textarea
          disabled={!editable}
          aria-label="Observaciones técnicas"
          className="min-h-20 rounded border p-2"
          {...register("technicalNotes")}
        />
        {editable && (
          <button
            disabled={isSubmitting}
            className="rounded bg-zinc-900 px-3 py-2 text-white"
          >
            Guardar sistema
          </button>
        )}
        <button
          type="button"
          className="rounded border border-red-800 px-3 py-2 text-red-800"
          onClick={() =>
            request(`/api/systems/${system._id}/active`, {
              active: !system.active,
            })
          }
        >
          {system.active ? "Desactivar" : "Reactivar"}
        </button>
      </form>
    </details>
  );
}
