"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { customerSchema } from "@/modules/customers/customer.schemas";
import Link from "next/link";
export function CustomerManager() {
  const client = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const debouncedQ = useDebouncedValue(q);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customerType: "PERSON",
      firstName: "",
      lastName: "",
      companyName: "",
      customerNumber: "",
      subscriberNumber: "",
      primaryPhone: "",
      secondaryPhone: "",
      email: "",
      address: "",
      department: "",
      subscriber: false,
      customerSince: "",
      contractStart: "",
      contractEnd: "",
      paymentMethod: "",
      internalNotes: "",
    },
  });
  const customerType = useWatch({ control, name: "customerType" });
  const subscriber = useWatch({ control, name: "subscriber" });
  const { data, isLoading } = useQuery({
    queryKey: ["customers", debouncedQ, page],
    queryFn: async () => {
      const r = await fetch(
        `/api/customers?q=${encodeURIComponent(debouncedQ)}&page=${page}&limit=20`,
      );
      if (!r.ok) throw new Error();
      return r.json();
    },
  });
  const create = useMutation({
    mutationFn: async (data) => {
      const r = await fetch("/api/customers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error?.message);
      return body;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["customers"] });
      reset({
        customerType: "PERSON",
        firstName: "",
        lastName: "",
        companyName: "",
        customerNumber: "",
        subscriberNumber: "",
        primaryPhone: "",
        secondaryPhone: "",
        email: "",
        address: "",
        department: "",
        subscriber: false,
        customerSince: "",
        contractStart: "",
        contractEnd: "",
        paymentMethod: "",
        internalNotes: "",
      });
    },
  });
  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form
        onSubmit={handleSubmit((data) => create.mutate(data))}
        className="space-y-3 rounded-xl border bg-white p-4"
      >
        <h2 className="font-bold">Nuevo cliente</h2>
        <select
          aria-label="Tipo"
          className="min-h-11 w-full rounded-lg border px-3"
          {...register("customerType")}
        >
          <option value="PERSON">Persona</option>
          <option value="COMPANY">Empresa</option>
        </select>
        {customerType === "PERSON" ? (
          <>
            <input
              aria-label="Nombre"
              required
              placeholder="Nombre"
              className="min-h-11 w-full rounded-lg border px-3"
              aria-invalid={!!errors.firstName}
              {...register("firstName")}
            />
            <input
              aria-label="Apellido"
              required
              placeholder="Apellido"
              className="min-h-11 w-full rounded-lg border px-3"
              aria-invalid={!!errors.lastName}
              {...register("lastName")}
            />
          </>
        ) : (
          <input
            aria-label="Razón social"
            required
            placeholder="Razón social"
            className="min-h-11 w-full rounded-lg border px-3"
            aria-invalid={!!errors.companyName}
            {...register("companyName")}
          />
        )}
        <input
          aria-label="Número de cliente"
          required
          placeholder="Número de cliente"
          className="min-h-11 w-full rounded-lg border px-3"
          aria-invalid={!!errors.customerNumber}
          {...register("customerNumber")}
        />
        <input
          aria-label="Dirección"
          required
          placeholder="Dirección principal"
          className="min-h-11 w-full rounded-lg border px-3"
          aria-invalid={!!errors.address}
          {...register("address")}
        />
        <input
          aria-label="Departamento"
          placeholder="Departamento"
          className="min-h-11 w-full rounded-lg border px-3"
          {...register("department")}
        />
        <input
          aria-label="Teléfono principal"
          required
          placeholder="Teléfono principal"
          className="min-h-11 w-full rounded-lg border px-3"
          aria-invalid={!!errors.primaryPhone}
          {...register("primaryPhone")}
        />
        <input
          aria-label="Teléfono secundario"
          placeholder="Teléfono secundario"
          className="min-h-11 w-full rounded-lg border px-3"
          {...register("secondaryPhone")}
        />
        <input
          type="email"
          aria-label="Correo electrónico"
          placeholder="Correo electrónico"
          className="min-h-11 w-full rounded-lg border px-3"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        <label className="flex gap-2">
          <input type="checkbox" {...register("subscriber")} />
          Abonado
        </label>
        {subscriber && (
          <input
            aria-label="Número de abonado"
            required
            placeholder="Número de abonado"
            className="min-h-11 w-full rounded-lg border px-3"
            aria-invalid={!!errors.subscriberNumber}
            {...register("subscriberNumber")}
          />
        )}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            ["customerSince", "Cliente desde"],
            ["contractStart", "Inicio de contrato"],
            ["contractEnd", "Fin de contrato"],
          ].map(([field, label]) => (
            <label key={field} className="text-sm">
              {label}
              <input
                type="date"
                className="mt-1 min-h-11 w-full rounded-lg border px-2"
                {...register(field)}
              />
            </label>
          ))}
        </div>
        <input
          aria-label="Forma de pago"
          placeholder="Forma de pago"
          className="min-h-11 w-full rounded-lg border px-3"
          {...register("paymentMethod")}
        />
        <textarea
          aria-label="Nota interna"
          placeholder="Nota interna"
          className="min-h-24 w-full rounded-lg border p-3"
          {...register("internalNotes")}
        />
        {Object.keys(errors).length > 0 && (
          <p role="alert" className="text-sm text-red-700">
            Revisa los campos obligatorios.
          </p>
        )}
        {create.error && (
          <p role="alert" className="text-sm text-red-700">
            {create.error.message}
          </p>
        )}
        <button
          disabled={create.isPending}
          className="min-h-11 w-full rounded-lg bg-red-800 font-semibold text-white"
        >
          Guardar cliente
        </button>
      </form>
      <section>
        <label className="sr-only" htmlFor="search">
          Buscar clientes
        </label>
        <input
          id="search"
          placeholder="Buscar por nombre, número, teléfono o dirección"
          className="mb-4 min-h-11 w-full rounded-lg border px-3"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        {isLoading ? (
          <p>Cargando…</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-white">
            {data?.items.map((item) => (
              <li key={item._id} className="p-4 font-medium">
                <Link
                  className="text-red-800 hover:underline"
                  href={`/customers/${item._id}`}
                >
                  {item.companyName || `${item.firstName} ${item.lastName}`}
                </Link>
                <span className="ml-3 text-sm font-normal text-zinc-600">
                  N.º {item.customerNumber} · {item.primaryPhone}
                </span>
                <p className="mt-1 text-sm font-normal text-zinc-600">
                  {item.address}
                  {item.department ? `, ${item.department}` : ""}
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
            Página {page} de {Math.max(1, Math.ceil((data?.total || 0) / 20))}
          </span>
          <button
            disabled={page * 20 >= (data?.total || 0)}
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
