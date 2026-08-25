import { AppHeader } from "@/components/layout/app-header";
import { SyncStatus } from "@/components/orders/sync-status";
export default function Page() {
  return (
    <>
      <AppHeader technician />
      <main className="mx-auto w-full max-w-xl flex-1 p-4">
        <h1 className="mb-5 text-2xl font-bold">Sincronización</h1>
        <SyncStatus />
      </main>
    </>
  );
}
