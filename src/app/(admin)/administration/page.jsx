import { AdministrationManager } from "@/components/admin/administration-manager";
import { AppHeader } from "@/components/layout/app-header";
export default function Page() {
  return (
    <>
      <AppHeader />
      <main className="page-container">
        <header className="page-title">
          <p className="eyebrow">Configuración</p>
          <h1>Administración</h1>
          <p>Empleados, accesos, vehículos y motivos operativos.</p>
        </header>
        <AdministrationManager />
      </main>
    </>
  );
}
