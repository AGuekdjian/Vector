import { AppHeader } from "@/components/layout/app-header";
import { OrderManager } from "@/components/admin/order-manager";
export default function Page() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
        <h1 className="mb-6 text-2xl font-bold">Órdenes de servicio</h1>
        <OrderManager />
      </main>
    </>
  );
}
