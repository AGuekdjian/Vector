"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { orderCreateSchema } from "@/modules/service-orders/order.schemas";
import { installationSchema } from "@/modules/installations/installation.schemas";
import Link from "next/link";
import { ListSkeleton } from "@/components/ui/skeleton";
import { toUruguayDateInput } from "@/shared/date";
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
  const [addingPlace, setAddingPlace] = useState(false);
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
      scheduledDate: toUruguayDateInput(),
      scheduledTime: "09:00",
      sequence: "",
      workDescription: "",
      technicianNote: "",
      internalNote: "",
      parentServiceOrderId: null,
    },
  });
  const placeForm = useForm({
    resolver: zodResolver(installationSchema),
    defaultValues: {
      customerId: "",
      name: "Dirección principal",
      address: "",
      department: "",
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
    placeholderData: (previous) => previous,
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
    staleTime: 2 * 60_000,
  });
  const createPlace = useMutation({
    mutationFn: async (data) => {
      const response = await fetch("/api/installations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message);
      return body.item;
    },
    onSuccess: (place) => {
      qc.setQueryData(["installations", selectedCustomerId], (current) => ({
        items: [...(current?.items || []), place],
      }));
      orderForm.setValue("installationId", place._id, {
        shouldValidate: true,
      });
      setAddingPlace(false);
    },
  });
  const chooseCustomer = async (customer) => {
    const name =
      customer.companyName || `${customer.firstName} ${customer.lastName}`;
    setSelectedCustomer(customer);
    setCustomerSearch(name);
    orderForm.setValue("customerId", customer._id, { shouldValidate: true });
    orderForm.setValue("installationId", "");
    setAddingPlace(false);
    placeForm.reset({
      customerId: customer._id,
      name: "Dirección principal",
      address: customer.address || "",
      department: customer.department || "",
    });
    try {
      const places = await qc.fetchQuery({
        queryKey: ["installations", customer._id],
        queryFn: () => get(`/api/installations?customerId=${customer._id}`),
        staleTime: 2 * 60_000,
      });
      if (places.items.length === 1)
        orderForm.setValue("installationId", places.items[0]._id, {
          shouldValidate: true,
        });
    } catch {
      // The query renders its normal error state and the order stays unselected.
    }
  };
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
        sequence: "",
        workDescription: "",
        technicianNote: "",
        internalNote: "",
        parentServiceOrderId: null,
      });
    },
  });
  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <form
        className="surface-card space-y-3 p-5"
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
          <label
            htmlFor="order-customer"
            className="mb-1 block text-sm font-medium"
          >
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
                    onClick={() => chooseCustomer(customer)}
                  >
                    <span className="block font-medium">
                      {customer.companyName ||
                        `${customer.firstName} ${customer.lastName}`}
                    </span>
                    <span className="block text-sm text-zinc-600">
                      N.º {customer.customerNumber || "—"} ·{" "}
                      {customer.primaryPhone}
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
        {selectedCustomer && (
          <fieldset className="space-y-2 rounded-lg border p-3">
            <legend className="px-1 text-sm font-semibold">
              Dirección donde se realizará el trabajo
            </legend>
            <p className="text-xs text-zinc-600">
              Un cliente puede tener varias ubicaciones: casa, empresa, depósito
              o sucursal.
            </p>
            {installations.isLoading ? (
              <p className="text-sm">Cargando direcciones…</p>
            ) : installations.data?.items.length && !addingPlace ? (
              <div className="space-y-2">
                <select
                  required
                  aria-label="Dirección del servicio"
                  className="min-h-11 w-full rounded-lg border px-3"
                  aria-invalid={!!orderForm.formState.errors.installationId}
                  {...orderForm.register("installationId")}
                >
                  <option value="">Seleccionar dirección</option>
                  {installations.data.items.map((place) => (
                    <option key={place._id} value={place._id}>
                      {place.name} — {place.address}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:border-red-800 hover:text-red-800"
                  onClick={() => {
                    setAddingPlace(true);
                    orderForm.setValue("installationId", "");
                    placeForm.reset({
                      customerId: selectedCustomer._id,
                      name: "Otra ubicación",
                      address: selectedCustomer.address || "",
                      department: selectedCustomer.department || "",
                    });
                  }}
                >
                  Usar otra dirección
                </button>
              </div>
            ) : (
              <div className="space-y-2 rounded-lg bg-amber-50 p-3">
                <p className="text-sm font-medium">
                  {installations.data?.items.length
                    ? "Edita la dirección tomada del cliente y guárdala para esta orden."
                    : "Este cliente todavía no tiene una ubicación de servicio."}
                </p>
                <input type="hidden" {...placeForm.register("customerId")} />
                <input
                  aria-label="Nombre de la ubicación"
                  placeholder="Casa, empresa, sucursal…"
                  className="min-h-10 w-full rounded border px-2"
                  {...placeForm.register("name")}
                />
                <input
                  aria-label="Dirección de la ubicación"
                  placeholder="Dirección"
                  className="min-h-10 w-full rounded border px-2"
                  {...placeForm.register("address")}
                />
                <input
                  aria-label="Departamento de la ubicación"
                  placeholder="Departamento"
                  className="min-h-10 w-full rounded border px-2"
                  {...placeForm.register("department")}
                />
                {createPlace.error && (
                  <p role="alert" className="text-sm text-red-700">
                    {createPlace.error.message}
                  </p>
                )}
                <button
                  type="button"
                  disabled={createPlace.isPending}
                  className="min-h-10 w-full rounded border border-red-800 px-3 text-red-800 disabled:opacity-60"
                  onClick={placeForm.handleSubmit((data) =>
                    createPlace.mutate(data),
                  )}
                >
                  {createPlace.isPending
                    ? "Guardando dirección…"
                    : "Usar esta dirección para la orden"}
                </button>
                {!!installations.data?.items.length && (
                  <button
                    type="button"
                    className="min-h-10 w-full rounded px-3 text-sm text-zinc-600"
                    onClick={() => {
                      setAddingPlace(false);
                      const first = installations.data.items[0];
                      orderForm.setValue("installationId", first._id, {
                        shouldValidate: true,
                      });
                    }}
                  >
                    Cancelar y usar la dirección guardada
                  </button>
                )}
              </div>
            )}
          </fieldset>
        )}
        {!selectedCustomer && (
          <p className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600">
            Busca y selecciona un cliente para elegir la dirección del servicio.
          </p>
        )}
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
        <label className="block text-sm">
          Orden de recorrido (opcional)
          <input
            type="number"
            min="0"
            aria-label="Orden de recorrido"
            placeholder="Ej.: 1"
            className="mt-1 min-h-11 w-full rounded-lg border px-3"
            {...orderForm.register("sequence", {
              setValueAs: (value) => (value === "" ? undefined : Number(value)),
            })}
          />
        </label>
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
        <textarea
          aria-label="Nota interna"
          placeholder="Nota interna (sólo OWNER y ADMIN)"
          className="min-h-20 w-full rounded-lg border p-3"
          {...orderForm.register("internalNote")}
        />
        {Object.keys(orderForm.formState.errors).length > 0 && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
          >
            <p className="font-semibold">No se puede crear la orden:</p>
            <ul className="mt-1 list-disc pl-5">
              {orderForm.formState.errors.customerId && (
                <li>Selecciona un cliente de los resultados de búsqueda.</li>
              )}
              {orderForm.formState.errors.installationId && (
                <li>
                  Selecciona o crea la dirección donde se hará el trabajo.
                </li>
              )}
              {orderForm.formState.errors.externalOrderNumber && (
                <li>Ingresa el número de OS de Eximia.</li>
              )}
              {orderForm.formState.errors.workDescription && (
                <li>Describe el trabajo a realizar.</li>
              )}
              {orderForm.formState.errors.scheduledDate && (
                <li>Revisa la fecha programada.</li>
              )}
              {orderForm.formState.errors.scheduledTime && (
                <li>Revisa la hora programada.</li>
              )}
              {orderForm.formState.errors.sequence && (
                <li>El orden de recorrido debe ser un número positivo.</li>
              )}
            </ul>
          </div>
        )}
        {create.isSuccess && (
          <p
            role="status"
            className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            Orden creada correctamente.
          </p>
        )}
        {create.error && (
          <p role="alert" className="text-sm text-red-700">
            {create.error.message}
          </p>
        )}
        <button
          disabled={create.isPending}
          className="min-h-11 w-full rounded-lg bg-red-800 font-semibold text-white disabled:opacity-60"
        >
          {create.isPending ? "Creando orden…" : "Crear orden"}
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
                  from: toUruguayDateInput(start),
                  to: toUruguayDateInput(end),
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
        {orders.isLoading ? (
          <ListSkeleton count={7} />
        ) : (
          <ul className="surface-card divide-y divide-zinc-100">
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
        )}
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
