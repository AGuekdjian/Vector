import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { AppHeader } from "@/components/layout/app-header";
export default function Page() {
  return (
    <>
      <AppHeader technician />
      <main className="mx-auto w-full max-w-md flex-1 p-4">
        <ChangePasswordForm />
      </main>
    </>
  );
}
