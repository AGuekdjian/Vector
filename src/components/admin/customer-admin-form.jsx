"use client";
import { useState } from "react";
export function CustomerAdminForm({ customer, onSaved }) {
  const [form, setForm] = useState({
    customerType: customer.customerType,
    firstName: customer.firstName || "",
    lastName: customer.lastName || "",
    companyName: customer.companyName || "",
    primaryPhone: customer.primaryPhone,
    secondaryPhone: customer.secondaryPhone || "",
    email: customer.email || "",
    subscriber: customer.subscriber,
    customerSince: customer.customerSince?.slice(0, 10) || "",
    contractStart: customer.contractStart?.slice(0, 10) || "",
    contractEnd: customer.contractEnd?.slice(0, 10) || "",
    paymentMethod: customer.paymentMethod || "",
    internalNotes: customer.internalNotes || "",
  });
  const [message, setMessage] = useState("");
  const save = async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(
      Object.entries(form).filter(
        ([key, value]) =>
          !["customerSince", "contractStart", "contractEnd"].includes(key) ||
          value,
      ),
    );
    const response = await fetch(`/api/customers/${customer._id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    setMessage(
      response.ok
        ? "Cliente actualizado"
        : body.error?.message || "No fue posible actualizar",
    );
    if (response.ok) onSaved?.();
  };
  const toggleActive = async () => {
    const response = await fetch(`/api/customers/${customer._id}/active`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: !customer.active }),
    });
    if (response.ok) onSaved?.();
  };
  return (
    <details className="mt-4">
      <summary className="cursor-pointer font-semibold text-red-800">
        Editar datos administrativos
      </summary>
      <form className="mt-3 grid gap-2 sm:grid-cols-2" onSubmit={save}>
        {[
          "firstName",
          "lastName",
          "companyName",
          "primaryPhone",
          "secondaryPhone",
          "email",
          "paymentMethod",
        ].map((field) => (
          <label key={field} className="text-sm">
            {field}
            <input
              className="mt-1 min-h-10 w-full rounded border px-2"
              value={form[field]}
              onChange={(event) =>
                setForm({ ...form, [field]: event.target.value })
              }
            />
          </label>
        ))}
        {[
          ["customerSince", "Cliente desde"],
          ["contractStart", "Inicio de contrato"],
          ["contractEnd", "Fin de contrato"],
        ].map(([field, label]) => (
          <label key={field} className="text-sm">
            {label}
            <input
              type="date"
              className="mt-1 min-h-10 w-full rounded border px-2"
              value={form[field]}
              onChange={(event) =>
                setForm({ ...form, [field]: event.target.value })
              }
            />
          </label>
        ))}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.subscriber}
            onChange={(event) =>
              setForm({ ...form, subscriber: event.target.checked })
            }
          />
          Abonado
        </label>
        <label className="sm:col-span-2">
          Nota interna
          <textarea
            className="mt-1 min-h-24 w-full rounded border p-2"
            value={form.internalNotes}
            onChange={(event) =>
              setForm({ ...form, internalNotes: event.target.value })
            }
          />
        </label>
        <button className="min-h-10 rounded bg-red-800 text-white">
          Guardar cambios
        </button>
        <button
          type="button"
          onClick={toggleActive}
          className="min-h-10 rounded border border-red-800 text-red-800"
        >
          {customer.active ? "Desactivar" : "Reactivar"}
        </button>
        {message && (
          <p role="status" className="sm:col-span-2">
            {message}
          </p>
        )}
      </form>
    </details>
  );
}
