"use client";
import { useState } from "react";
export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const submit = async (event) => {
    event.preventDefault();
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
    if (response.ok) {
      setCurrentPassword("");
      setNewPassword("");
    }
  };
  return (
    <form
      className="space-y-3 rounded-xl border bg-white p-4"
      onSubmit={submit}
    >
      <h1 className="text-xl font-bold">Cambiar contraseña o PIN</h1>
      <label className="block">
        Actual
        <input
          type="password"
          autoComplete="current-password"
          className="mt-1 min-h-11 w-full rounded-lg border px-3"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
      </label>
      <label className="block">
        Nueva
        <input
          type="password"
          autoComplete="new-password"
          className="mt-1 min-h-11 w-full rounded-lg border px-3"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
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
