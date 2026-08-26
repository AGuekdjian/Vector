import { AppHeader } from "@/components/layout/app-header";
import { OrderManager } from "@/components/admin/order-manager";
export default function Page() {
  return (
    <>
      <AppHeader />
      <main className="page-container">
        <header className="page-title">
          <p className="eyebrow">Planificación</p>
          <h1>Órdenes de servicio</h1>
          <p>Crea, asigna y consulta el estado de cada visita técnica.</p>
        </header>
        <OrderManager />
      </main>
    </>
  );
}
