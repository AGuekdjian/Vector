"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(4).max(128),
  newPassword: z.string().min(4).max(128),
});
export function ChangePasswordForm() {
  const [message, setMessage] = useState("");
  const { register, handleSubmit, reset } = useForm({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });
  const submit = async ({ currentPassword, newPassword }) => {
    const response = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const body = await response.json();
    setMessage(
      response.ok
        ? "Contraseña actualizada."
        : body.error?.message || "No fue posible actualizar.",
    );
    if (response.ok) reset();
  };
  return (
    <form
      className="space-y-3 rounded-xl border bg-white p-4"
      onSubmit={handleSubmit(submit)}
      noValidate
    >
      <h1 className="text-xl font-bold">Cambiar contraseña o PIN</h1>
      <label className="block">
        Actual
        <input
          type="password"
          autoComplete="current-password"
          className="mt-1 min-h-11 w-full rounded-lg border px-3"
          {...register("currentPassword")}
        />
      </label>
      <label className="block">
        Nueva
        <input
          type="password"
          autoComplete="new-password"
          className="mt-1 min-h-11 w-full rounded-lg border px-3"
          {...register("newPassword")}
        />
      </label>
      <button className="min-h-11 w-full rounded-lg bg-red-800 font-semibold text-white">
        Actualizar
      </button>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </form>
  );
}
