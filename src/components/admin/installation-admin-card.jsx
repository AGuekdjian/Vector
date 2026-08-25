"use client";
import { useForm } from "react-hook-form";

export function InstallationAdminCard({
  installation,
  selected,
  onSelect,
  onChanged,
}) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      name: installation.name,
      address: installation.address,
      department: installation.department || "",
    },
  });
  const request = async (url, data) => {
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error((await response.json()).error?.message);
    onChanged();
  };
  return (
    <details
      className={`rounded-lg border p-3 ${selected ? "border-zinc-900" : "bg-white"}`}
      open={selected}
    >
      <summary
        className="cursor-pointer font-semibold"
        onClick={(event) => {
          event.preventDefault();
          onSelect();
        }}
      >
        {installation.name} {!installation.active && "(inactiva)"}
      </summary>
      <form
        className="mt-3 grid gap-2"
        onSubmit={handleSubmit((data) =>
          request(`/api/installations/${installation._id}`, data),
        )}
      >
        <input
          aria-label="Nombre de instalación"
          className="min-h-10 rounded border px-2"
          {...register("name", { required: true })}
        />
        <input
          aria-label="Dirección de instalación"
          className="min-h-10 rounded border px-2"
          {...register("address", { required: true })}
        />
        <input
          aria-label="Departamento de instalación"
          className="min-h-10 rounded border px-2"
          {...register("department")}
        />
        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={isSubmitting}
            className="rounded bg-zinc-900 px-3 py-2 text-white"
          >
            Guardar
          </button>
          <button
            type="button"
            className="rounded border border-red-800 px-3 py-2 text-red-800"
            onClick={() =>
              request(`/api/installations/${installation._id}/active`, {
                active: !installation.active,
              })
            }
          >
            {installation.active ? "Desactivar" : "Reactivar"}
          </button>
        </div>
      </form>
    </details>
  );
}
