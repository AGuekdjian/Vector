import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { AppHeader } from "@/components/layout/app-header";
export default function Page() {
  return (
    <>
      <AppHeader technician />
      <main className="page-container max-w-md">
        <ChangePasswordForm />
      </main>
    </>
  );
}
