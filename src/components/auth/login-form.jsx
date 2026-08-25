"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { loginSchema } from "@/modules/auth/auth.schemas";

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });
  const submit = async (values) => {
    setServerError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const body = await response.json();
    if (!response.ok) {
      setServerError(body.error?.message || "No fue posible ingresar.");
      return;
    }
    router.replace(
      body.user.role === "TECHNICIAN" ? "/technician/orders" : "/dashboard",
    );
    router.refresh();
  };
  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit(submit)} noValidate>
      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="username">
          Usuario
        </label>
        <input
          className="min-h-12 w-full rounded-lg border border-zinc-300 px-3 focus:border-red-800 focus:outline-none focus:ring-2 focus:ring-red-800/20"
          id="username"
          autoComplete="username"
          {...register("username")}
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-700">Usuario inválido.</p>
        )}
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="password">
          Contraseña o PIN
        </label>
        <input
          className="min-h-12 w-full rounded-lg border border-zinc-300 px-3 focus:border-red-800 focus:outline-none focus:ring-2 focus:ring-red-800/20"
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-700">Contraseña inválida.</p>
        )}
      </div>
      {serverError && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
        >
          {serverError}
        </p>
      )}
      <button
        disabled={isSubmitting}
        className="min-h-12 w-full rounded-lg bg-red-800 px-4 font-semibold text-white hover:bg-red-900 disabled:opacity-60"
      >
        {isSubmitting ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
