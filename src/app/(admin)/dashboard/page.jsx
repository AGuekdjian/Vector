import { Dashboard } from "@/components/admin/dashboard";
import { AppHeader } from "@/components/layout/app-header";
export default function Page() {
  return (
    <>
      <AppHeader />
      <main className="page-container">
        <header className="page-title">
          <p className="eyebrow">Operación</p>
          <h1>Resumen operativo</h1>
          <p>Una vista rápida del volumen y resultado de las órdenes.</p>
        </header>
        <Dashboard />
      </main>
    </>
  );
}
