import { CustomerDetail } from "@/components/admin/customer-detail";
import { AppHeader } from "@/components/layout/app-header";
export default async function Page({ params }) {
  const { id } = await params;
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
        <CustomerDetail id={id} />
      </main>
    </>
  );
}
