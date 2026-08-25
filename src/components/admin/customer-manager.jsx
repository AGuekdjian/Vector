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
      primaryPhone: "",
      subscriber: false,
    },
  });
  const customerType = useWatch({ control, name: "customerType" });
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
        primaryPhone: "",
        subscriber: false,
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
          aria-label="Teléfono principal"
          required
          placeholder="Teléfono principal"
          className="min-h-11 w-full rounded-lg border px-3"
          aria-invalid={!!errors.primaryPhone}
          {...register("primaryPhone")}
        />
        <label className="flex gap-2">
          <input type="checkbox" {...register("subscriber")} />
          Abonado
        </label>
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
          placeholder="Buscar por nombre o teléfono"
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
                  {item.primaryPhone}
                </span>
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
