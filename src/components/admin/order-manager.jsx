"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import Link from "next/link";
const get = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error();
  return r.json();
};
export function OrderManager() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [number, setNumber] = useState("");
  const debouncedNumber = useDebouncedValue(number);
  const [range, setRange] = useState({ from: "", to: "" });
  const [form, setForm] = useState({
    externalOrderNumber: "",
    customerId: "",
    installationId: "",
    responsibleTechnicianId: null,
    companionEmployeeId: null,
    vehicleId: null,
    scheduledDate: new Date().toISOString().slice(0, 10),
    scheduledTime: "09:00",
    workDescription: "",
    technicianNote: "",
    internalNote: "",
  });
  const orders = useQuery({
    queryKey: ["orders-admin", status, debouncedNumber, range],
    queryFn: () =>
      get(
        `/api/orders?status=${status}&number=${encodeURIComponent(debouncedNumber)}&dateFrom=${range.from}&dateTo=${range.to}`,
      ),
  });
  const customers = useQuery({
    queryKey: ["customers-select"],
    queryFn: () => get("/api/customers?limit=100"),
  });
  const users = useQuery({
    queryKey: ["users"],
    queryFn: () => get("/api/users"),
  });
  const employees = useQuery({
    queryKey: ["employees"],
    queryFn: () => get("/api/employees?limit=100"),
  });
  const vehicles = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => get("/api/vehicles"),
  });
  const installations = useQuery({
    queryKey: ["installations", form.customerId],
    queryFn: () => get(`/api/installations?customerId=${form.customerId}`),
    enabled: !!form.customerId,
  });
  const create = useMutation({
    mutationFn: async (data) => {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error?.message);
      return body;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders-admin"] });
      setForm((old) => ({
        ...old,
        externalOrderNumber: "",
        workDescription: "",
      }));
    },
  });
  const set = (key, value) =>
    setForm((old) => ({ ...old, [key]: value || null }));
  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <form
        className="space-y-3 rounded-xl border bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate(form);
        }}
      >
        <h2 className="font-bold">Nueva orden</h2>
        <input
          required
          aria-label="Número OS"
          placeholder="Número OS de Eximia"
          className="min-h-11 w-full rounded-lg border px-3"
          value={form.externalOrderNumber}
          onChange={(e) => set("externalOrderNumber", e.target.value)}
        />
        <select
          required
          aria-label="Cliente"
          className="min-h-11 w-full rounded-lg border px-3"
          value={form.customerId || ""}
          onChange={(e) =>
            setForm((old) => ({
              ...old,
              customerId: e.target.value || null,
              installationId: "",
            }))
          }
        >
          <option value="">Cliente</option>
          {customers.data?.items.map((x) => (
            <option key={x._id} value={x._id}>
              {x.companyName || `${x.firstName} ${x.lastName}`}
            </option>
          ))}
        </select>
        <select
          required
          aria-label="Instalación"
          className="min-h-11 w-full rounded-lg border px-3"
          value={form.installationId || ""}
          onChange={(e) => set("installationId", e.target.value)}
        >
          <option value="">Instalación</option>
          {installations.data?.items.map((x) => (
            <option key={x._id} value={x._id}>
              {x.name} — {x.address}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            required
            aria-label="Fecha"
            className="min-h-11 rounded-lg border px-3"
            value={form.scheduledDate}
            onChange={(e) => set("scheduledDate", e.target.value)}
          />
          <input
            type="time"
            required
            aria-label="Hora"
            className="min-h-11 rounded-lg border px-3"
            value={form.scheduledTime}
            onChange={(e) => set("scheduledTime", e.target.value)}
          />
        </div>
        <select
          aria-label="Técnico"
          className="min-h-11 w-full rounded-lg border px-3"
          value={form.responsibleTechnicianId || ""}
          onChange={(e) => set("responsibleTechnicianId", e.target.value)}
        >
          <option value="">Sin asignar</option>
          {users.data?.items
            .filter((x) => x.role === "TECHNICIAN" && x.active)
            .map((x) => (
              <option key={x._id} value={x._id}>
                {x.employeeId.firstName} {x.employeeId.lastName}
              </option>
            ))}
        </select>
        <select
          aria-label="Compañero"
          className="min-h-11 w-full rounded-lg border px-3"
          value={form.companionEmployeeId || ""}
          onChange={(e) => set("companionEmployeeId", e.target.value)}
        >
          <option value="">Solo</option>
          {employees.data?.items
            .filter((x) => x.active)
            .map((x) => (
              <option key={x._id} value={x._id}>
                {x.firstName} {x.lastName}
              </option>
            ))}
        </select>
        <select
          aria-label="Vehículo"
          className="min-h-11 w-full rounded-lg border px-3"
          value={form.vehicleId || ""}
          onChange={(e) => set("vehicleId", e.target.value)}
        >
          <option value="">Sin vehículo</option>
          {vehicles.data?.items
            .filter((x) => x.active)
            .map((x) => (
              <option key={x._id} value={x._id}>
                {x.plate}
              </option>
            ))}
        </select>
        <textarea
          required
          aria-label="Trabajo"
          placeholder="Trabajo a realizar"
          className="min-h-24 w-full rounded-lg border p-3"
          value={form.workDescription}
          onChange={(e) => set("workDescription", e.target.value)}
        />
        <textarea
          aria-label="Nota técnico"
          placeholder="Nota visible al técnico"
          className="min-h-20 w-full rounded-lg border p-3"
          value={form.technicianNote}
          onChange={(e) => set("technicianNote", e.target.value)}
        />
        {create.error && (
          <p role="alert" className="text-sm text-red-700">
            {create.error.message}
          </p>
        )}
        <button className="min-h-11 w-full rounded-lg bg-red-800 font-semibold text-white">
          Crear orden
        </button>
      </form>
      <section>
        <div className="mb-3 flex flex-wrap gap-2">
          {[
            { label: "Hoy", days: 1, offset: 0 },
            { label: "Ayer", days: 1, offset: 1 },
            { label: "7 días", days: 7, offset: 0 },
            { label: "14 días", days: 14, offset: 0 },
          ].map(({ label, days, offset }) => (
            <button
              key={label}
              className="rounded-lg border bg-white px-3 py-2 text-sm"
              onClick={() => {
                const end = new Date();
                end.setDate(end.getDate() - offset);
                const start = new Date(end);
                start.setDate(start.getDate() - days + 1);
                setRange({
                  from: start.toISOString().slice(0, 10),
                  to: end.toISOString().slice(0, 10),
                });
              }}
            >
              {label}
            </button>
          ))}
          <input
            aria-label="Fecha específica"
            type="date"
            className="rounded-lg border px-2"
            onChange={(e) =>
              setRange({ from: e.target.value, to: e.target.value })
            }
          />
          <button
            className="rounded-lg px-3 py-2 text-sm text-zinc-600"
            onClick={() => setRange({ from: "", to: "" })}
          >
            Limpiar
          </button>
        </div>
        <div className="mb-4 flex gap-2">
          <input
            aria-label="Buscar OS"
            placeholder="Número OS"
            className="min-h-11 flex-1 rounded-lg border px-3"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
          <select
            aria-label="Estado"
            className="rounded-lg border px-3"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos</option>
            {[
              "PENDING",
              "ASSIGNED",
              "IN_PROGRESS",
              "COMPLETED",
              "REQUIRES_QUOTE",
              "NOT_COMPLETED",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
        <ul className="divide-y rounded-xl border bg-white">
          {orders.data?.items.map((x) => (
            <li key={x._id} className="p-4">
              <div className="flex justify-between">
                <Link
                  className="font-bold text-red-800 hover:underline"
                  href={`/orders/${x._id}`}
                >
                  OS {x.externalOrderNumber}
                </Link>
                <span>{x.status}</span>
              </div>
              <p className="mt-1 text-sm text-zinc-600">
                {x.customerId?.companyName ||
                  `${x.customerId?.firstName || ""} ${x.customerId?.lastName || ""}`}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
