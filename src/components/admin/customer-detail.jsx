"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { CustomerAdminForm } from "@/components/admin/customer-admin-form";
import { InstallationAdminCard } from "@/components/admin/installation-admin-card";
import { SystemAdminCard } from "@/components/admin/system-admin-card";
import { installationSchema } from "@/modules/installations/installation.schemas";
import { systemSchema } from "@/modules/systems/system.schemas";
const clientSystemSchema = systemSchema.omit({ installedAt: true });
const get = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error((await r.json()).error?.message);
  return r.json();
};
export function CustomerDetail({ id }) {
  const qc = useQueryClient();
  const installationForm = useForm({
    resolver: zodResolver(installationSchema),
    defaultValues: { customerId: id, name: "", address: "", department: "" },
  });
  const [selected, setSelected] = useState("");
  const systemForm = useForm({
    resolver: zodResolver(clientSystemSchema),
    defaultValues: {
      installationId: "",
      type: "ALARM",
      brand: "",
      model: "",
      description: "",
      imei: "",
      serialNumber: "",
      technicalNotes: "",
    },
  });
  const customer = useQuery({
    queryKey: ["customer", id],
    queryFn: () => get(`/api/customers/${id}`),
  });
  const installations = useQuery({
    queryKey: ["installations", id],
    queryFn: () =>
      get(`/api/installations?customerId=${id}&includeInactive=true`),
  });
  const systems = useQuery({
    queryKey: ["systems", selected],
    queryFn: () =>
      get(`/api/systems?installationId=${selected}&includeInactive=true`),
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
      installationForm.reset({
        customerId: id,
        name: "",
        address: "",
        department: "",
      });
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
      systemForm.reset({
        ...systemForm.getValues(),
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
          onSubmit={installationForm.handleSubmit((data) =>
            createInstallation.mutate(data),
          )}
          noValidate
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
              {...installationForm.register(field)}
            />
          ))}
          <button className="min-h-11 w-full rounded-lg bg-red-800 font-semibold text-white">
            Agregar instalación
          </button>
        </form>
        <div>
          <h2 className="mb-3 font-bold">Instalaciones</h2>
          <div className="grid gap-2">
            {installations.data?.items.map((x) => (
              <InstallationAdminCard
                key={x._id}
                installation={x}
                selected={selected === x._id}
                onSelect={() => {
                  setSelected(x._id);
                  systemForm.setValue("installationId", x._id);
                }}
                onChanged={() =>
                  qc.invalidateQueries({ queryKey: ["installations", id] })
                }
              />
            ))}
          </div>
          {selected && (
            <div className="mt-4 grid gap-4 lg:grid-cols-[300px_1fr]">
              <form
                className="space-y-2 rounded-xl border bg-white p-4"
                onSubmit={systemForm.handleSubmit((data) =>
                  createSystem.mutate(data),
                )}
                noValidate
              >
                <h3 className="font-bold">Agregar sistema</h3>
                <select
                  aria-label="Tipo de sistema"
                  className="min-h-10 w-full rounded border px-2"
                  {...systemForm.register("type")}
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
                    {...systemForm.register(field)}
                  />
                ))}
                <button className="min-h-10 w-full rounded bg-red-800 text-white">
                  Guardar sistema
                </button>
              </form>
              <ul className="divide-y rounded-xl border bg-white">
                {systems.data?.items.map((x) => (
                  <li key={x._id}>
                    <SystemAdminCard
                      system={x}
                      onChanged={() =>
                        qc.invalidateQueries({
                          queryKey: ["systems", selected],
                        })
                      }
                    />
                    <div className="sr-only">
                      <strong>
                        {x.type}: {x.brand} {x.model}
                      </strong>
                      <p className="text-sm text-zinc-600">
                        {x.status} {x.imei && `· IMEI ${x.imei}`}{" "}
                        {x.serialNumber && `· Serie ${x.serialNumber}`}
                      </p>
                    </div>
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
