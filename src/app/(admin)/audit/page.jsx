import { AuditList } from "@/components/admin/audit-list";
import { AppHeader } from "@/components/layout/app-header";
export default function Page() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">
        <h1 className="mb-6 text-2xl font-bold">Auditoría</h1>
        <AuditList />
      </main>
    </>
  );
}
