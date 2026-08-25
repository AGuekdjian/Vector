import { AppHeader } from "@/components/layout/app-header";
import { TechnicianOrderList } from "@/components/orders/technician-order-list";
export const metadata = { title: "Mis órdenes" };
export default function TechnicianOrdersPage() {
  return (
    <>
      <AppHeader technician />
      <main className="mx-auto w-full max-w-xl flex-1 p-4">
        <h1 className="mb-1 text-2xl font-bold">Mis órdenes</h1>
        <p className="mb-5 text-sm font-semibold uppercase tracking-wide text-red-800">
          Hoy
        </p>
        <TechnicianOrderList />
      </main>
    </>
  );
}
