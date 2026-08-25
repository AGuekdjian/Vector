export const metadata = { title: "Ingresar" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-5">
      <section className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-zinc-950">Ingresar</h1>
        <p className="mt-2 text-zinc-600">
          Acceso para administración y técnicos.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
import { LoginForm } from "@/components/auth/login-form";
