import Link from "next/link";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { LogoutButton } from "@/components/auth/logout-button";
export function AppHeader({ technician = false }) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4">
        <Link
          className="font-bold text-red-800"
          href={technician ? "/technician/orders" : "/dashboard"}
        >
          VECTOR
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {!technician && (
            <>
              <Link href="/customers">Clientes</Link>
              <Link href="/orders">Órdenes</Link>
              <Link href="/administration">Administrar</Link>
            </>
          )}
          {technician && <Link href="/technician/profile">Perfil</Link>}
          <OfflineIndicator
            href={technician ? "/technician/sync" : undefined}
          />
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
