import { AdminOrderDetail } from "@/components/admin/order-detail";
import { AppHeader } from "@/components/layout/app-header";
export default async function Page({ params }) {
  const { id } = await params;
  return (
    <>
      <AppHeader />
      <main className="page-container max-w-5xl">
        <AdminOrderDetail id={id} />
      </main>
    </>
  );
}
