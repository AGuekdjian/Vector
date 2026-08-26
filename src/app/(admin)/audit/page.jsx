import { AuditList } from "@/components/admin/audit-list";
import { AppHeader } from "@/components/layout/app-header";
export default function Page() {
  return (
    <>
      <AppHeader />
      <main className="page-container max-w-5xl">
        <header className="page-title">
          <p className="eyebrow">Trazabilidad</p>
          <h1>Auditoría</h1>
          <p>Registro inmutable de acciones relevantes del sistema.</p>
        </header>
        <AuditList />
      </main>
    </>
  );
}
