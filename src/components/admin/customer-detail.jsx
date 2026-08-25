"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CustomerAdminForm } from "@/components/admin/customer-admin-form";
const get = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error((await r.json()).error?.message);
  return r.json();
};
export function CustomerDetail({ id }) {
  const qc = useQueryClient();
  const [installation, setInstallation] = useState({
    customerId: id,
    name: "",
    address: "",
    department: "",
  });
  const [selected, setSelected] = useState("");
  const [system, setSystem] = useState({
    installationId: "",
    type: "ALARM",
    brand: "",
    model: "",
    imei: "",
    serialNumber: "",
    technicalNotes: "",
  });
  const customer = useQuery({
    queryKey: ["customer", id],
    queryFn: () => get(`/api/customers/${id}`),
  });
  const installations = useQuery({
    queryKey: ["installations", id],
    queryFn: () => get(`/api/installations?customerId=${id}`),
  });
  const systems = useQuery({
    queryKey: ["systems", selected],
    queryFn: () => get(`/api/systems?installationId=${selected}`),
    enabled: !!selected,
  });
  const history = useQuery({
    queryKey: ["customer-orders", id],
    queryFn: () => get(`/api/orders?customerId=${id}&limit=100`),
  });
  const createInstallation = useMutation({
    mutationFn: async (data) => {
      const r = await fetch("/api/installations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["installations", id] });
      setInstallation({ ...installation, name: "", address: "" });
    },
  });
  const createSystem = useMutation({
    mutationFn: async (data) => {
      const r = await fetch("/api/systems", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["systems", selected] });
      setSystem({
        ...system,
        brand: "",
        model: "",
        imei: "",
        serialNumber: "",
      });
    },
  });
  if (customer.isLoading) return <p>Cargando…</p>;
  const item = customer.data?.item;
  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-white p-5">
        <h1 className="text-2xl font-bold">
          {item.companyName || `${item.firstName} ${item.lastName}`}
        </h1>
        <p className="mt-2">
          {item.primaryPhone} · {item.subscriber ? "Abonado" : "No abonado"}
        </p>
        <CustomerAdminForm
          customer={item}
          onSaved={() => qc.invalidateQueries({ queryKey: ["customer", id] })}
        />
      </section>
      <section className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <form
          className="space-y-3 rounded-xl border bg-white p-4"
          onSubmit={(e) => {
            e.preventDefault();
            createInstallation.mutate(installation);
          }}
        >
          <h2 className="font-bold">Nueva instalación</h2>
          {["name", "address", "department"].map((field) => (
            <input
              key={field}
              required={field !== "department"}
              aria-label={field}
              placeholder={
                {
                  name: "Nombre (Casa, Empresa…)",
                  address: "Dirección",
                  department: "Departamento",
                }[field]
              }
              className="min-h-11 w-full rounded-lg border px-3"
              value={installation[field]}
              onChange={(e) =>
                setInstallation({ ...installation, [field]: e.target.value })
              }
            />
          ))}
          <button className="min-h-11 w-full rounded-lg bg-red-800 font-semibold text-white">
            Agregar instalación
          </button>
        </form>
        <div>
          <h2 className="mb-3 font-bold">Instalaciones</h2>
          <div className="flex flex-wrap gap-2">
            {installations.data?.items.map((x) => (
              <button
                key={x._id}
                onClick={() => {
                  setSelected(x._id);
                  setSystem((old) => ({ ...old, installationId: x._id }));
                }}
                className={`rounded-lg border px-3 py-2 ${selected === x._id ? "bg-zinc-900 text-white" : "bg-white"}`}
              >
                {x.name}
              </button>
            ))}
          </div>
          {selected && (
            <div className="mt-4 grid gap-4 lg:grid-cols-[300px_1fr]">
              <form
                className="space-y-2 rounded-xl border bg-white p-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  createSystem.mutate(system);
                }}
              >
                <h3 className="font-bold">Agregar sistema</h3>
                <select
                  aria-label="Tipo de sistema"
                  className="min-h-10 w-full rounded border px-2"
                  value={system.type}
                  onChange={(e) =>
                    setSystem({ ...system, type: e.target.value })
                  }
                >
                  {["ALARM", "CCTV", "ACCESS_CONTROL", "OTHER"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
                {[
                  "brand",
                  "model",
                  "imei",
                  "serialNumber",
                  "technicalNotes",
                ].map((field) => (
                  <input
                    key={field}
                    aria-label={field}
                    placeholder={field}
                    className="min-h-10 w-full rounded border px-2"
                    value={system[field]}
                    onChange={(e) =>
                      setSystem({ ...system, [field]: e.target.value })
                    }
                  />
                ))}
                <button className="min-h-10 w-full rounded bg-red-800 text-white">
                  Guardar sistema
                </button>
              </form>
              <ul className="divide-y rounded-xl border bg-white">
                {systems.data?.items.map((x) => (
                  <li key={x._id} className="p-3">
                    <strong>
                      {x.type}: {x.brand} {x.model}
                    </strong>
                    <p className="text-sm text-zinc-600">
                      {x.status} {x.imei && `· IMEI ${x.imei}`}{" "}
                      {x.serialNumber && `· Serie ${x.serialNumber}`}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
      <section>
        <h2 className="mb-3 font-bold">Historial de órdenes</h2>
        <ul className="divide-y rounded-xl border bg-white">
          {history.data?.items.map((x) => (
            <li key={x._id} className="p-3">
              OS {x.externalOrderNumber} · {x.status}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
