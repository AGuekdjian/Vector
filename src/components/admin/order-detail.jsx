"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { orderUpdateSchema } from "@/modules/service-orders/order.schemas";

const get = async (url) => {
  const response = await fetch(url);
  const body = await response.json();
  if (!response.ok)
    throw new Error(body.error?.message || "No fue posible cargar los datos.");
  return body;
};

function OrderEditor({ order }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(orderUpdateSchema),
    defaultValues: {
      responsibleTechnicianId:
        order.responsibleTechnicianId?._id ||
        order.responsibleTechnicianId ||
        null,
      companionEmployeeId: order.companionEmployeeId?._id || null,
      vehicleId: order.vehicleId?._id || null,
      scheduledDate: new Date(order.scheduledDate).toISOString().slice(0, 10),
      scheduledTime: order.scheduledTime,
      workDescription: order.workDescription,
      serviceType: order.serviceType || "MAINTENANCE",
      technicianNote: order.technicianNote || "",
      internalNote: order.internalNote || "",
    },
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
  const update = useMutation({
    mutationFn: async (data) => {
      const response = await fetch(`/api/orders/${order._id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message);
      return body;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["order-admin", order._id] }),
  });
  const editable = ["PENDING", "ASSIGNED", "RESCHEDULED"].includes(
    order.status,
  );
  return (
    <form
      className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2"
      onSubmit={handleSubmit((data) => update.mutate(data))}
      noValidate
    >
      <h2 className="font-bold sm:col-span-2">Asignación y planificación</h2>
      <select
        disabled={!editable}
        aria-label="Técnico responsable"
        className="min-h-11 rounded-lg border px-3"
        {...register("responsibleTechnicianId", {
          setValueAs: (value) => value || null,
        })}
      >
        <option value="">Sin asignar</option>
        {users.data?.items
          .filter((user) => user.role === "TECHNICIAN" && user.active)
          .map((user) => (
            <option key={user._id} value={user._id}>
              {user.employeeId.firstName} {user.employeeId.lastName}
            </option>
          ))}
      </select>
      <select
        disabled={!editable}
        aria-label="Compañero"
        className="min-h-11 rounded-lg border px-3"
        {...register("companionEmployeeId", {
          setValueAs: (value) => value || null,
        })}
      >
        <option value="">Solo</option>
        {employees.data?.items.map((employee) => (
          <option key={employee._id} value={employee._id}>
            {employee.firstName} {employee.lastName}
          </option>
        ))}
      </select>
      <select
        disabled={!editable}
        aria-label="Vehículo"
        className="min-h-11 rounded-lg border px-3"
        {...register("vehicleId", { setValueAs: (value) => value || null })}
      >
        <option value="">Sin vehículo</option>
        {vehicles.data?.items.map((vehicle) => (
          <option key={vehicle._id} value={vehicle._id}>
            {vehicle.plate}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input
          disabled={!editable}
          aria-label="Fecha programada"
          type="date"
          className="min-h-11 rounded-lg border px-2"
          {...register("scheduledDate")}
        />
        <input
          disabled={!editable}
          aria-label="Hora programada"
          type="time"
          className="min-h-11 rounded-lg border px-2"
          {...register("scheduledTime")}
        />
      </div>
      <label className="sm:col-span-2">
        Trabajo a realizar
        <select
          aria-label="Tipo de servicio"
          className="min-h-11 w-full rounded-lg border px-3"
          {...register("serviceType")}
        >
          <option value="INSTALLATION">Instalación</option>
          <option value="MAINTENANCE">Mantenimiento</option>
          <option value="REPAIR">Reparación</option>
          <option value="INSPECTION">Inspección</option>
          <option value="OTHER">Otro</option>
        </select>
        <textarea
          disabled={!editable}
          className="mt-1 min-h-24 w-full rounded-lg border p-3"
          {...register("workDescription")}
        />
      </label>
      <label>
        Nota para técnico
        <textarea
          disabled={!editable}
          className="mt-1 min-h-20 w-full rounded-lg border p-3"
          {...register("technicianNote")}
        />
      </label>
      <label>
        Nota interna
        <textarea
          disabled={!editable}
          className="mt-1 min-h-20 w-full rounded-lg border p-3"
          {...register("internalNote")}
        />
      </label>
      {update.error && (
        <p role="alert" className="text-sm text-red-700 sm:col-span-2">
          {update.error.message}
        </p>
      )}
      {editable && (
        <button
          disabled={update.isPending}
          className="min-h-11 rounded-lg bg-red-800 font-semibold text-white sm:col-span-2"
        >
          Guardar cambios
        </button>
      )}
    </form>
  );
}

export function AdminOrderDetail({ id }) {
  const orderQuery = useQuery({
    queryKey: ["order-admin", id],
    queryFn: () => get(`/api/orders/${id}`),
  });
  if (orderQuery.isLoading)
    return <div className="h-72 animate-pulse rounded-xl bg-zinc-200" />;
  if (orderQuery.error)
    return (
      <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">
        {orderQuery.error.message}
      </p>
    );
  const order = orderQuery.data.item;
  return (
    <div className="space-y-5">
      <section className="surface-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-500">Orden de servicio</p>
            <h1 className="text-2xl font-bold">
              OS {order.externalOrderNumber}
            </h1>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold">
            {order.status}
          </span>
        </div>
        <p className="mt-4 font-semibold">
          {order.customerId.companyName ||
            `${order.customerId.firstName || ""} ${order.customerId.lastName || ""}`}
        </p>
        <p className="text-zinc-600">
          Lugar del servicio: {order.installationId.name} · {order.installationId.address}
        </p>
        {order.technicianObservation && (
          <p className="mt-3 rounded-lg bg-emerald-50 p-3">
            {order.technicianObservation}
          </p>
        )}
        {order.quoteDetails && (
          <p className="mt-3 rounded-lg bg-amber-50 p-3">
            Cotizar: {order.quoteDetails}
          </p>
        )}
      </section>
      <OrderEditor key={`${order._id}-${order.updatedAt}`} order={order} />
      <section className="rounded-xl border bg-white p-4">
        <h2 className="font-bold">Timeline</h2>
        <ol className="mt-3 divide-y">
          {order.timeline.map((event) => (
            <li
              key={event._id}
              className="flex justify-between gap-3 py-3 text-sm"
            >
              <span>{event.action}</span>
              <time className="text-zinc-500">
                {new Date(event.createdAt).toLocaleString("es-UY")}
              </time>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
