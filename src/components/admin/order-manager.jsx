"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { orderCreateSchema } from "@/modules/service-orders/order.schemas";
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
  const [page, setPage] = useState(1);
  const [technicianId, setTechnicianId] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const debouncedCustomerSearch = useDebouncedValue(customerSearch);
  const orderForm = useForm({
    resolver: zodResolver(orderCreateSchema),
    defaultValues: {
      externalOrderNumber: "",
      customerId: "",
      installationId: "",
      serviceType: "MAINTENANCE",
      responsibleTechnicianId: null,
      companionEmployeeId: null,
      vehicleId: null,
      scheduledDate: new Date().toISOString().slice(0, 10),
      scheduledTime: "09:00",
      workDescription: "",
      technicianNote: "",
      internalNote: "",
      parentServiceOrderId: null,
    },
  });
  const selectedCustomerId = useWatch({
    control: orderForm.control,
    name: "customerId",
  });
  const orders = useQuery({
    queryKey: [
      "orders-admin",
      status,
      debouncedNumber,
      range,
      technicianId,
      customerFilter,
      page,
    ],
    queryFn: () =>
      get(
        `/api/orders?status=${status}&number=${encodeURIComponent(debouncedNumber)}&dateFrom=${range.from}&dateTo=${range.to}&technicianId=${technicianId}&customerId=${customerFilter}&page=${page}&limit=20`,
      ),
  });
  const customers = useQuery({
    queryKey: ["customers-select", debouncedCustomerSearch],
    queryFn: () =>
      get(
        `/api/customers?q=${encodeURIComponent(debouncedCustomerSearch)}&limit=20`,
      ),
  });
  const users = useQuery({
    queryKey: ["users"],
    queryFn: () => get("/api/users?active=true&limit=100"),
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
    queryKey: ["installations", selectedCustomerId],
    queryFn: () => get(`/api/installations?customerId=${selectedCustomerId}`),
    enabled: !!selectedCustomerId,
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
      orderForm.reset({
        ...orderForm.getValues(),
        externalOrderNumber: "",
        workDescription: "",
      });
    },
  });
  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <form
        className="space-y-3 rounded-xl border bg-white p-4"
        onSubmit={orderForm.handleSubmit((data) => create.mutate(data))}
        noValidate
      >
        <h2 className="font-bold">Nueva orden</h2>
        <input
          required
          aria-label="Número OS"
          placeholder="Número OS de Eximia"
          className="min-h-11 w-full rounded-lg border px-3"
          {...orderForm.register("externalOrderNumber")}
        />
        <div className="relative">
          <label htmlFor="order-customer" className="mb-1 block text-sm font-medium">
            Cliente
          </label>
          <input type="hidden" {...orderForm.register("customerId")} />
          <input
            id="order-customer"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={!!customerSearch && !selectedCustomer}
            aria-controls="order-customer-results"
            autoComplete="off"
            placeholder="Buscar por nombre, número, teléfono o dirección"
            className="min-h-11 w-full rounded-lg border px-3"
            value={customerSearch}
            onChange={(event) => {
              setCustomerSearch(event.target.value);
              setSelectedCustomer(null);
              orderForm.setValue("customerId", "", { shouldValidate: true });
              orderForm.setValue("installationId", "");
            }}
          />
          {!!customerSearch && !selectedCustomer && (
            <ul
              id="order-customer-results"
              role="listbox"
              className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border bg-white shadow-lg"
            >
              {customers.data?.items.map((customer) => (
                <li key={customer._id} role="option" aria-selected="false">
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-zinc-100"
                    onClick={() => {
                      const name =
                        customer.companyName ||
                        `${customer.firstName} ${customer.lastName}`;
                      setSelectedCustomer(customer);
                      setCustomerSearch(name);
                      orderForm.setValue("customerId", customer._id, {
                        shouldValidate: true,
                      });
                      orderForm.setValue("installationId", "");
                    }}
                  >
                    <span className="block font-medium">
                      {customer.companyName ||
                        `${customer.firstName} ${customer.lastName}`}
                    </span>
                    <span className="block text-sm text-zinc-600">
                      N.º {customer.customerNumber || "—"} · {customer.primaryPhone}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {selectedCustomer && (
          <div className="rounded-lg bg-zinc-50 p-3 text-sm" aria-live="polite">
            <p className="font-medium">Dirección principal del cliente</p>
            <p>
              {selectedCustomer.address || "No registrada"}
              {selectedCustomer.department
                ? `, ${selectedCustomer.department}`
                : ""}
            </p>
            {selectedCustomer.subscriberNumber && (
              <p className="mt-1 text-zinc-600">
                Abonado N.º {selectedCustomer.subscriberNumber}
              </p>
            )}
          </div>
        )}
        <select
          required
          aria-label="Lugar del servicio"
          className="min-h-11 w-full rounded-lg border px-3"
          {...orderForm.register("installationId")}
        >
          <option value="">Lugar del servicio</option>
          {installations.data?.items.map((x) => (
            <option key={x._id} value={x._id}>
              {x.name} — {x.address}
            </option>
          ))}
        </select>
        <select
          required
          aria-label="Tipo de servicio"
          className="min-h-11 w-full rounded-lg border px-3"
          {...orderForm.register("serviceType")}
        >
          <option value="INSTALLATION">Instalación</option>
          <option value="MAINTENANCE">Mantenimiento</option>
          <option value="REPAIR">Reparación</option>
          <option value="INSPECTION">Inspección</option>
          <option value="OTHER">Otro</option>
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            required
            aria-label="Fecha"
            className="min-h-11 rounded-lg border px-3"
            {...orderForm.register("scheduledDate")}
          />
          <input
            type="time"
            required
            aria-label="Hora"
            className="min-h-11 rounded-lg border px-3"
            {...orderForm.register("scheduledTime")}
          />
        </div>
        <select
          aria-label="Técnico"
          className="min-h-11 w-full rounded-lg border px-3"
          {...orderForm.register("responsibleTechnicianId", {
            setValueAs: (value) => value || null,
          })}
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
          {...orderForm.register("companionEmployeeId", {
            setValueAs: (value) => value || null,
          })}
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
          {...orderForm.register("vehicleId", {
            setValueAs: (value) => value || null,
          })}
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
          placeholder="Trabajo a realizar (detalle de la tarea)"
          className="min-h-24 w-full rounded-lg border p-3"
          {...orderForm.register("workDescription")}
        />
        <select
          aria-label="Orden original"
          className="min-h-11 w-full rounded-lg border px-3"
          {...orderForm.register("parentServiceOrderId", {
            setValueAs: (value) => value || null,
          })}
        >
          <option value="">Sin orden relacionada</option>
          {orders.data?.items
            .filter((item) =>
              ["REQUIRES_QUOTE", "NOT_COMPLETED", "COMPLETED"].includes(
                item.status,
              ),
            )
            .map((item) => (
              <option key={item._id} value={item._id}>
                OS {item.externalOrderNumber}
              </option>
            ))}
        </select>
        <textarea
          aria-label="Nota técnico"
          placeholder="Nota visible al técnico"
          className="min-h-20 w-full rounded-lg border p-3"
          {...orderForm.register("technicianNote")}
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
        <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
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
          <select
            aria-label="Filtrar por técnico"
            className="min-h-11 rounded-lg border px-3"
            value={technicianId}
            onChange={(event) => {
              setTechnicianId(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos los técnicos</option>
            {users.data?.items
              .filter((item) => item.role === "TECHNICIAN" && item.active)
              .map((item) => (
                <option key={item._id} value={item._id}>
                  {item.employeeId.firstName} {item.employeeId.lastName}
                </option>
              ))}
          </select>
          <select
            aria-label="Filtrar por cliente"
            className="min-h-11 rounded-lg border px-3"
            value={customerFilter}
            onChange={(event) => {
              setCustomerFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos los clientes</option>
            {customers.data?.items.map((item) => (
              <option key={item._id} value={item._id}>
                {item.companyName || `${item.firstName} ${item.lastName}`}
              </option>
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
                {` · ${
                  {
                    INSTALLATION: "Instalación",
                    MAINTENANCE: "Mantenimiento",
                    REPAIR: "Reparación",
                    INSPECTION: "Inspección",
                    OTHER: "Otro",
                  }[x.serviceType] || "Mantenimiento"
                }`}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between">
          <button
            disabled={page === 1}
            className="rounded border px-3 py-2 disabled:opacity-40"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Anterior
          </button>
          <span className="text-sm">
            Página {page} de{" "}
            {Math.max(1, Math.ceil((orders.data?.total || 0) / 20))}
          </span>
          <button
            disabled={page * 20 >= (orders.data?.total || 0)}
            className="rounded border px-3 py-2 disabled:opacity-40"
            onClick={() => setPage((value) => value + 1)}
          >
            Siguiente
          </button>
        </div>
      </section>
    </div>
  );
}
