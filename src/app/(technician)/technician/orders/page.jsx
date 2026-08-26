import { AppHeader } from "@/components/layout/app-header";
import { TechnicianOrderList } from "@/components/orders/technician-order-list";
export const metadata = { title: "Mis órdenes" };
export default function TechnicianOrdersPage() {
  return (
    <>
      <AppHeader technician />
      <main className="page-container max-w-xl">
        <header className="page-title">
          <p className="eyebrow">Agenda de hoy</p>
          <h1>Mis órdenes</h1>
          <p>Información disponible también sin conexión.</p>
        </header>
        <TechnicianOrderList />
      </main>
    </>
  );
}
