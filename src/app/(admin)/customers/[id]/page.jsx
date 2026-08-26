import { CustomerDetail } from "@/components/admin/customer-detail";
import { AppHeader } from "@/components/layout/app-header";
export default async function Page({ params }) {
  const { id } = await params;
  return (
    <>
      <AppHeader />
      <main className="page-container">
        <CustomerDetail id={id} />
      </main>
    </>
  );
}
