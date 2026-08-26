import { CustomerManager } from "@/components/admin/customer-manager";
import { AppHeader } from "@/components/layout/app-header";
export default function Page() {
  return (
    <>
      <AppHeader />
      <main className="page-container">
        <header className="page-title">
          <p className="eyebrow">Directorio</p>
          <h1>Clientes</h1>
          <p>Datos administrativos, ubicaciones, sistemas e historial.</p>
        </header>
        <CustomerManager />
      </main>
    </>
  );
}
