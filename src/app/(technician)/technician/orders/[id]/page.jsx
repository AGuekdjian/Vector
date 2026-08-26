import { AppHeader } from "@/components/layout/app-header";
import { TechnicianOrderDetail } from "@/components/orders/technician-order-detail";
export default async function Page({ params }) {
  const { id } = await params;
  return (
    <>
      <AppHeader technician />
      <main className="page-container max-w-xl">
        <TechnicianOrderDetail id={id} />
      </main>
    </>
  );
}
