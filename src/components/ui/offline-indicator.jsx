"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useConnectivity } from "@/offline/connectivity";
import { getOutboxCounts } from "@/offline/outbox";
export function OfflineIndicator({ href }) {
  const online = useConnectivity();
  const [counts, setCounts] = useState({ pending: 0, conflicts: 0 });
  useEffect(() => {
    const refresh = () =>
      getOutboxCounts()
        .then(setCounts)
        .catch(() => {});
    refresh();
    addEventListener("vector:outbox-changed", refresh);
    return () => removeEventListener("vector:outbox-changed", refresh);
  }, []);
  const label = !online
    ? "Sin conexión"
    : counts.conflicts
      ? `${counts.conflicts} conflicto(s)`
      : counts.pending
        ? `${counts.pending} pendiente(s)`
        : "En línea";
  const className = `rounded-full px-2 py-1 text-xs font-semibold ${online && !counts.conflicts && !counts.pending ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`;
  return href ? (
    <Link href={href} className={className} role="status">
      {label}
    </Link>
  ) : (
    <span className={className} role="status">
      {label}
    </span>
  );
}
