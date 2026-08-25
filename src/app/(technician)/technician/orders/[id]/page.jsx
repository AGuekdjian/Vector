import { AppHeader } from "@/components/layout/app-header";
import { TechnicianOrderDetail } from "@/components/orders/technician-order-detail";
export default async function Page({ params }) {
  const { id } = await params;
  return (
    <>
      <AppHeader technician />
      <main className="mx-auto w-full max-w-xl flex-1 bg-zinc-100 p-4">
        <TechnicianOrderDetail id={id} />
      </main>
    </>
  );
}
