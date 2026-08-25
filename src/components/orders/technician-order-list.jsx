"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect } from "react";
import {
  getCachedOrders,
  initializeOfflineIdentity,
  replaceCachedOrders,
} from "@/offline/indexed-db";
async function loadOrders() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const response = await fetch(`/api/orders/snapshot?date=${today}`);
    if (!response.ok) throw new Error();
    const body = await response.json();
    const meResponse = await fetch("/api/auth/me");
    if (meResponse.ok)
      await initializeOfflineIdentity((await meResponse.json()).user.id);
    await replaceCachedOrders(body.items);
    return body.items;
  } catch {
    return getCachedOrders();
  }
}
const customerName = (customer) =>
  customer.companyName ||
  `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
export function TechnicianOrderList() {
  const {
    data = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["technician", "orders"],
    queryFn: loadOrders,
    staleTime: 30_000,
  });
  useEffect(() => {
    const online = () => refetch();
    addEventListener("online", online);
    return () => removeEventListener("online", online);
  }, [refetch]);
  if (isLoading)
    return (
      <div className="space-y-3" aria-label="Cargando órdenes">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-32 animate-pulse rounded-xl bg-zinc-200" />
        ))}
      </div>
    );
  if (!data.length)
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-600">
        No tienes órdenes sincronizadas.
      </p>
    );
  return (
    <ul className="space-y-3">
      {data.map((order) => (
        <li key={order._id}>
          <Link
            href={`/technician/orders/${order._id}`}
            className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <div className="flex justify-between gap-3">
              <span className="font-bold text-zinc-950">
                {order.scheduledTime}
              </span>
              <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold">
                {order.status}
              </span>
            </div>
            <h2 className="mt-2 font-semibold">
              {customerName(order.customerId)}
            </h2>
            <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
              {order.workDescription}
            </p>
            <p className="mt-2 text-sm text-zinc-700">
              {order.installationId?.address}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
