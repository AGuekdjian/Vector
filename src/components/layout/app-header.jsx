"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { LogoutButton } from "@/components/auth/logout-button";

const icons = {
  dashboard: "M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z",
  customers:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87m0-12.26a4 4 0 0 1 0 7.75",
  orders:
    "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  administration:
    "M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Zm7.4-3.5a7.8 7.8 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.8-1L14.8 3h-4l-.4 3a8 8 0 0 0-1.8 1L6.2 6 4.2 9.5l2 1.5a7.8 7.8 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 1.8 1l.4 3h4l.4-3a8 8 0 0 0 1.8-1l2.4 1 2-3.4-2-1.5a7.8 7.8 0 0 0 .1-1Z",
  audit:
    "M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9m-8-6h8v8m0-8L10 14",
  system: "M4 5h16v11H4V5Zm5 15h6m-3-4v4",
  profile: "M20 21a8 8 0 0 0-16 0m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
};

function NavIcon({ name }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5 shrink-0"
    >
      <path d={icons[name]} />
    </svg>
  );
}

export function AppHeader({ technician = false }) {
  const pathname = usePathname();
  const { data } = useQuery({
    queryKey: ["session-user"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me");
      if (!response.ok) throw new Error();
      return response.json();
    },
    staleTime: 5 * 60_000,
  });
  const links = technician
    ? [
        ["/technician/orders", "Mis órdenes", "orders"],
        ["/technician/profile", "Perfil", "profile"],
      ]
    : [
        ["/dashboard", "Resumen", "dashboard"],
        ["/customers", "Clientes", "customers"],
        ["/orders", "Órdenes", "orders"],
        ["/administration", "Administrar", "administration"],
        ...(data?.user.role === "OWNER"
          ? [["/owner/system", "Sistema", "system"]]
          : []),
      ];
  const home = technician ? "/technician/orders" : "/dashboard";

  return (
    <header className={technician ? "technician-header" : "admin-app-header"}>
      <div className="app-brand-row">
        <Link className="app-brand" href={home} aria-label="Vector, inicio">
          <span className="app-brand-mark">V</span>
          <span>
            <strong>Vector</strong>
            <small>Gestión de servicios</small>
          </span>
        </Link>
        <div className="header-mobile-actions">
          <OfflineIndicator
            href={technician ? "/technician/sync" : undefined}
          />
          <LogoutButton />
        </div>
      </div>
      <nav className="app-navigation" aria-label="Navegación principal">
        {links.map(([href, label, icon]) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={active ? "nav-link nav-link-active" : "nav-link"}
            >
              <NavIcon name={icon} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="app-account">
        <div className="account-avatar" aria-hidden="true">
          {data?.user?.name?.charAt(0)?.toUpperCase() || "V"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {data?.user?.name || "Cargando…"}
          </p>
          <p className="text-xs text-zinc-400">
            {data?.user?.role === "OWNER"
              ? "Propietario"
              : data?.user?.role === "ADMIN"
                ? "Administrador"
                : data?.user?.role === "TECHNICIAN"
                  ? "Técnico"
                  : "Sesión activa"}
          </p>
        </div>
        <div className="account-actions">
          <OfflineIndicator
            href={technician ? "/technician/sync" : undefined}
          />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
