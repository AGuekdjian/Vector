"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { LogoutButton } from "@/components/auth/logout-button";
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
        ["/technician/orders", "Mis órdenes"],
        ["/technician/profile", "Perfil"],
      ]
    : [
        ["/dashboard", "Resumen"],
        ["/customers", "Clientes"],
        ["/orders", "Órdenes"],
        ["/administration", "Administrar"],
        ...(data?.user.role === "OWNER"
          ? [
              ["/audit", "Auditoría"],
              ["/owner/system", "Sistema"],
            ]
          : []),
      ];
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center gap-x-5 px-4">
        <Link
          className="flex items-center gap-2 py-3 font-bold tracking-tight text-zinc-950"
          href={technician ? "/technician/orders" : "/dashboard"}
        >
          <span className="grid size-8 place-items-center rounded-lg bg-red-800 text-sm text-white shadow-sm">
            V
          </span>
          <span>Vector</span>
        </Link>
        <nav className="order-3 flex w-full gap-1 overflow-x-auto border-t border-zinc-100 py-2 text-sm sm:order-none sm:w-auto sm:flex-1 sm:border-0 sm:py-0">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={`shrink-0 rounded-lg px-3 py-2 font-medium ${
                pathname.startsWith(href)
                  ? "bg-red-50 text-red-900"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 py-2">
          <OfflineIndicator
            href={technician ? "/technician/sync" : undefined}
          />
          {data?.user && (
            <div className="border-l border-zinc-200 pl-3 text-right">
              <p className="max-w-28 truncate text-xs font-semibold text-zinc-800 sm:max-w-40">
                {data.user.name}
              </p>
              <p className="hidden text-[11px] text-zinc-500 sm:block">
                {data.user.role}
              </p>
            </div>
          )}
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
