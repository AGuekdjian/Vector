"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
const get = async (url) => (await fetch(url)).json();
const post = async (url, data) => {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  const b = await r.json();
  if (!r.ok) throw new Error(b.error?.message);
  return b;
};
const patch = async (url, data) => {
  const r = await fetch(url, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  const b = await r.json();
  if (!r.ok) throw new Error(b.error?.message);
  return b;
};
export function AdministrationManager() {
  const qc = useQueryClient();
  const [employee, setEmployee] = useState({ firstName: "", lastName: "" });
  const [plate, setPlate] = useState("");
  const [reason, setReason] = useState("");
  const [user, setUser] = useState({
    employeeId: "",
    role: "TECHNICIAN",
    password: "",
  });
  const employees = useQuery({
    queryKey: ["employees"],
    queryFn: () => get("/api/employees?limit=100"),
  });
  const vehicles = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => get("/api/vehicles"),
  });
  const users = useQuery({
    queryKey: ["users"],
    queryFn: () => get("/api/users"),
  });
  const reasons = useQuery({
    queryKey: ["reasons"],
    queryFn: () => get("/api/not-completed-reasons?includeInactive=true"),
  });
  const me = useQuery({ queryKey: ["me"], queryFn: () => get("/api/auth/me") });
  const addEmployee = useMutation({
    mutationFn: (data) => post("/api/employees", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      setEmployee({ firstName: "", lastName: "" });
    },
  });
  const addVehicle = useMutation({
    mutationFn: (data) => post("/api/vehicles", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      setPlate("");
    },
  });
  const addUser = useMutation({
    mutationFn: (data) => post("/api/users", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setUser((current) => ({ ...current, password: "" }));
    },
  });
  const addReason = useMutation({
    mutationFn: (data) => post("/api/not-completed-reasons", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reasons"] });
      setReason("");
    },
  });
  const toggle = async (resource, item, key) => {
    await patch(`/api/${resource}/${item._id}/active`, {
      active: !item.active,
    });
    qc.invalidateQueries({ queryKey: [key] });
  };
  const changeRole = async (item, role) => {
    await patch(`/api/users/${item._id}/role`, { role });
    qc.invalidateQueries({ queryKey: ["users"] });
  };
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <section className="rounded-xl border bg-white p-4">
        <h2 className="font-bold">Empleados</h2>
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            addEmployee.mutate(employee);
          }}
        >
          <input
            required
            aria-label="Nombre"
            placeholder="Nombre"
            className="min-h-10 w-full rounded border px-2"
            value={employee.firstName}
            onChange={(e) =>
              setEmployee({ ...employee, firstName: e.target.value })
            }
          />
          <input
            required
            aria-label="Apellido"
            placeholder="Apellido"
            className="min-h-10 w-full rounded border px-2"
            value={employee.lastName}
            onChange={(e) =>
              setEmployee({ ...employee, lastName: e.target.value })
            }
          />
          <button className="min-h-10 w-full rounded bg-red-800 text-white">
            Agregar
          </button>
        </form>
        <ul className="mt-4 divide-y">
          {employees.data?.items.map((x) => (
            <li
              key={x._id}
              className="flex items-center justify-between gap-2 py-2"
            >
              <span className={!x.active ? "text-zinc-400" : ""}>
                {x.firstName} {x.lastName}
              </span>
              <button
                className="rounded border px-2 py-1 text-xs"
                onClick={() => toggle("employees", x, "employees")}
              >
                {x.active ? "Desactivar" : "Reactivar"}
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border bg-white p-4">
        <h2 className="font-bold">Usuarios</h2>
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            addUser.mutate(user);
          }}
        >
          <select
            required
            aria-label="Empleado"
            className="min-h-10 w-full rounded border px-2"
            value={user.employeeId}
            onChange={(e) => setUser({ ...user, employeeId: e.target.value })}
          >
            <option value="">Empleado</option>
            {employees.data?.items
              .filter((x) => x.active)
              .map((x) => (
                <option key={x._id} value={x._id}>
                  {x.firstName} {x.lastName}
                </option>
              ))}
          </select>
          <select
            aria-label="Rol"
            className="min-h-10 w-full rounded border px-2"
            value={user.role}
            onChange={(e) => setUser({ ...user, role: e.target.value })}
          >
            <option>TECHNICIAN</option>
            <option>ADMIN</option>
          </select>
          <input
            required
            minLength={user.role === "ADMIN" ? 12 : 4}
            type="password"
            aria-label="Contraseña"
            placeholder="Contraseña inicial segura"
            className="min-h-10 w-full rounded border px-2"
            value={user.password}
            onChange={(e) => setUser({ ...user, password: e.target.value })}
          />
          {addUser.error && (
            <p className="text-sm text-red-700">{addUser.error.message}</p>
          )}
          <button className="min-h-10 w-full rounded bg-red-800 text-white">
            Crear usuario
          </button>
        </form>
        <ul className="mt-4 divide-y">
          {users.data?.items.map((x) => (
            <li
              key={x._id}
              className="flex items-center justify-between gap-2 py-2"
            >
              <span className={!x.active ? "text-zinc-400" : ""}>
                {x.username} · {x.role}
              </span>
              {x.role !== "OWNER" && (
                <span className="flex gap-1">
                  {me.data?.user?.role === "OWNER" && (
                    <select
                      aria-label={`Rol de ${x.username}`}
                      className="rounded border px-1 text-xs"
                      value={x.role}
                      onChange={(event) => changeRole(x, event.target.value)}
                    >
                      <option>TECHNICIAN</option>
                      <option>ADMIN</option>
                    </select>
                  )}
                  <button
                    className="rounded border px-2 py-1 text-xs"
                    onClick={() => toggle("users", x, "users")}
                  >
                    {x.active ? "Desactivar" : "Reactivar"}
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border bg-white p-4">
        <h2 className="font-bold">Vehículos</h2>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addVehicle.mutate({ plate });
          }}
        >
          <input
            required
            aria-label="Matrícula"
            placeholder="Matrícula"
            className="min-h-10 min-w-0 flex-1 rounded border px-2"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
          />
          <button className="rounded bg-red-800 px-3 text-white">
            Agregar
          </button>
        </form>
        <ul className="mt-4 divide-y">
          {vehicles.data?.items.map((x) => (
            <li
              key={x._id}
              className="flex items-center justify-between gap-2 py-2"
            >
              <span className={!x.active ? "text-zinc-400" : ""}>
                {x.plate}
              </span>
              <button
                className="rounded border px-2 py-1 text-xs"
                onClick={() => toggle("vehicles", x, "vehicles")}
              >
                {x.active ? "Desactivar" : "Reactivar"}
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border bg-white p-4 lg:col-span-3">
        <h2 className="font-bold">Motivos de orden no realizada</h2>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            addReason.mutate({ label: reason });
          }}
        >
          <input
            required
            minLength={3}
            aria-label="Nuevo motivo"
            className="min-h-10 min-w-0 flex-1 rounded border px-2"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          <button className="rounded bg-red-800 px-3 text-white">
            Agregar
          </button>
        </form>
        <ul className="mt-3 divide-y">
          {reasons.data?.items.map((item) => (
            <li
              key={item._id}
              className="flex items-center justify-between py-2"
            >
              <span className={!item.active ? "text-zinc-400" : ""}>
                {item.label}
              </span>
              <button
                className="rounded border px-2 py-1 text-xs"
                onClick={async () => {
                  await patch(`/api/not-completed-reasons/${item._id}`, {
                    active: !item.active,
                  });
                  qc.invalidateQueries({ queryKey: ["reasons"] });
                }}
              >
                {item.active ? "Desactivar" : "Reactivar"}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
