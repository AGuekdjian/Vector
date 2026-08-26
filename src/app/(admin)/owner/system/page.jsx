import { AppHeader } from "@/components/layout/app-header";
import { SystemPanel } from "@/components/owner/system-panel";
import { requireUser } from "@/lib/permissions/authorize";

export default async function Page() {
  await requireUser(["OWNER"]);
  return (
    <>
      <AppHeader />
      <main className="page-container">
        <header className="page-title">
          <p className="eyebrow">Sólo propietario</p>
          <h1>Control y salud</h1>
          <p>
            Estado técnico, fallas recientes y trazabilidad de la aplicación.
          </p>
        </header>
        <SystemPanel />
      </main>
    </>
  );
}
