"use client";
import { useRouter } from "next/navigation";
import { clearOfflineData } from "@/offline/indexed-db";
import { getOutboxCounts } from "@/offline/outbox";
export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="text-sm text-zinc-600 hover:text-red-800"
      onClick={async () => {
        const counts = await getOutboxCounts().catch(() => ({
          pending: 0,
          conflicts: 0,
        }));
        if (counts.pending || counts.conflicts) {
          alert(
            "Debes sincronizar o resolver las operaciones pendientes antes de salir.",
          );
          return;
        }
        await fetch("/api/auth/logout", { method: "POST" });
        await clearOfflineData().catch(() => {});
        router.replace("/login");
        router.refresh();
      }}
    >
      Salir
    </button>
  );
}
